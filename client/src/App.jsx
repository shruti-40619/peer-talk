import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { Routes, Route, useParams, useNavigate } from "react-router-dom";
import "./App.css";
import camera from "./assets/camera.png";
import no_camera from "./assets/no_camera.png";
import mute from "./assets/mute.png";
import unmute from "./assets/unmute.png";
import screen_share from "./assets/screen_share.png";
import no_screen_share from "./assets/no_screen_share.png";
import end_call from "./assets/end_call.png";





function Home() {
  const navigate = useNavigate();

  const createMeeting = () => {
    const roomId = crypto.randomUUID();
    navigate(`/room/${roomId}`);
  };

  return (
    <div>
      <h1>PeerTalk</h1>
      <button onClick={createMeeting}>Create Meeting</button>
    </div>
  );
}



function Meeting() {

  const { roomId } = useParams();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const localStreamRef = useRef(null);
  const pcRef = useRef(null);
  const socketRef = useRef(null);

  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  
  useEffect(() => {
    async function init() {
      // Create PeerConnection
      pcRef.current = new RTCPeerConnection({
          iceServers: [
               { urls: "stun:stun.l.google.com:19302" },
               {
                 urls: "turn:openrelay.metered.ca:80",
                 username: "openrelayproject",
                 credential: "openrelayproject"
               },
               {
                 urls: "turn:openrelay.metered.ca:443",
                 username: "openrelayproject",
                 credential: "openrelayproject"
               },
               {
                 urls: "turns:openrelay.metered.ca:443",
                 username: "openrelayproject",
                 credential: "openrelayproject"
               }
        ]
      });

      console.log("PeerConnection created");

      // ICE candidates → send via socket
      pcRef.current.onicecandidate = (event) => {
        if (event.candidate) {
          console.log("ICE candidate:", event.candidate.candidate);
          socketRef.current.emit("signal", {
            roomId,
            data: { candidate: event.candidate }
          });
        }
      };

      // Remote track
      pcRef.current.ontrack = (event) => {
       if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
       }

      };

      // Get local media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      localStreamRef.current = stream;
      if (localVideoRef.current) {
           localVideoRef.current.srcObject = stream;
      }


      stream.getTracks().forEach(track => {
        pcRef.current.addTrack(track, stream);
      });

      console.log("Local tracks added");

      // Connect socket
      socketRef.current = io(window.location.origin, {
             transports: ["websocket"],
      });


      socketRef.current.on("connect", () => {
        console.log("Socket connected:", socketRef.current.id);
        socketRef.current.emit("join-room", { roomId });
      });

      socketRef.current.on("user-left", () => {
        console.log("Remote user left the meeting");
        if (remoteVideoRef.current) {
           remoteVideoRef.current.srcObject = null;
        }
      });
      
      socketRef.current.on("chat-message", (data) => {
         setMessages(prev => [...prev, data]);
      });


      // Existing user → create OFFER
      socketRef.current.on("user-joined", async () => {
        console.log("User joined → creating offer");

        const offer = await pcRef.current.createOffer();
        await pcRef.current.setLocalDescription(offer);

        socketRef.current.emit("signal", {
          roomId,
          data: { offer }
        });
      });

      // Handle signaling
      socketRef.current.on("signal", async (data) => {
        console.log("Signal received:", data);

        if (data.offer) {
          // Answerer
          await pcRef.current.setRemoteDescription(
            new RTCSessionDescription(data.offer)
          );

          const answer = await pcRef.current.createAnswer();
          await pcRef.current.setLocalDescription(answer);

          socketRef.current.emit("signal", {
            roomId,
            data: { answer }
          });
        }

        else if (data.answer) {
          // Offerer
          await pcRef.current.setRemoteDescription(
            new RTCSessionDescription(data.answer)
          );
        }

        else if (data.candidate) {
          await pcRef.current.addIceCandidate(
            new RTCIceCandidate(data.candidate)
          );
        }
      });
    }

    init();

    return () => {
      if (socketRef.current) {
        socketRef.current.off("user-left");
        socketRef.current.off("signal");
        socketRef.current.disconnect();
      }

      if (pcRef.current) {
         pcRef.current.close();
         pcRef.current = null;
      }
    };

  }, []);

  const toggleMute = () => {
  if (!localStreamRef.current) return;

  const audioTrack = localStreamRef.current
    .getAudioTracks()[0];

  if (!audioTrack) return;

  audioTrack.enabled = !audioTrack.enabled;
  setIsMuted(!audioTrack.enabled);

  console.log(
    audioTrack.enabled ? "Mic unmuted" : "Mic muted"
  );
 };

  const toggleCamera = () => {
  if (!localStreamRef.current) return;

  const videoTrack = localStreamRef.current
    .getVideoTracks()[0];

  if (!videoTrack) return;

  videoTrack.enabled = !videoTrack.enabled;
  setIsCameraOff(!videoTrack.enabled);

  console.log(
    videoTrack.enabled ? "Camera ON" : "Camera OFF"
  );
 };

 const toggleScreenShare = async () => {
  if (!pcRef.current || !localStreamRef.current) return;

  // find the video sender
  const sender = pcRef.current
    .getSenders()
    .find(s => s.track && s.track.kind === "video");

  if (!sender) return;

  if (!isScreenSharing) {
    // START screen share
    const screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: false
    });

    const screenTrack = screenStream.getVideoTracks()[0];

    await sender.replaceTrack(screenTrack);
    localVideoRef.current.srcObject = screenStream;

    screenTrack.onended = () => {
      stopScreenShare(sender);
    };

    setIsScreenSharing(true);
    console.log("Screen sharing started");
  } else {
    stopScreenShare(sender);
  }
 };

 const stopScreenShare = async (sender) => {
  const cameraTrack =
    localStreamRef.current.getVideoTracks()[0];

  await sender.replaceTrack(cameraTrack);
  localVideoRef.current.srcObject = localStreamRef.current;

  setIsScreenSharing(false);
  console.log("Screen sharing stopped");
 };

  const leaveMeeting = () => {
  console.log("You left the meeting");

  // Stop local media tracks
  if (localStreamRef.current) {
    localStreamRef.current.getTracks().forEach(track => track.stop());
    localStreamRef.current = null;
  }

  // Close PeerConnection
  if (pcRef.current) {
    pcRef.current.onicecandidate = null;
    pcRef.current.ontrack = null;
    pcRef.current.close();
    pcRef.current = null;
  }

  // Clear video elements
  if (localVideoRef.current) {
    localVideoRef.current.srcObject = null;
  }
  if (remoteVideoRef.current) {
    remoteVideoRef.current.srcObject = null;
  }

  // Reset UI state
  setIsMuted(false);
  setIsCameraOff(false);
  setIsScreenSharing(false);

  // notify others
  socketRef.current?.emit("user-left", { roomId });
 };
  
  const sendMessage = () => {
  if (!messageInput.trim()) return;

  const msg = {
    roomId,
    message: messageInput,
    sender: socketRef.current.id
  };

  // show own message immediately
  setMessages(prev => [
    ...prev,
    { ...msg, time: new Date().toLocaleTimeString() }
  ]);

  socketRef.current.emit("chat-message", msg);
  setMessageInput("");
  };



 return ( 
  <div className="app-root">
    {/* Top Bar */}
    <div className="top-bar">
      <div className="name">
        <span>PeerTalk</span>
      </div>
      <div className="live-badge">● Live</div>
    </div>

    {/* Main Content */}
    <div className="content">
      {/* Video Section */}
      <div className="video-area">
        <div className="video-container">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="remote-video"
          />

          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="local-video"
          />
        </div>

        {/* Controls */}
        <div className="controls-bar">
          <button
              className="ctrl-btn end"
              onClick={leaveMeeting}
              title="End Call"
          >
            <img src={end_call} alt="end call" className="icon" />
          </button>

          <button
                className="ctrl-btn"
                onClick={toggleMute}
                title={isMuted ? "Unmute" : "Mute"}
          >
            <img
               src={isMuted ? mute : unmute}
               alt="mute"
               className="icon"
            />
          </button>

          <button
              className="ctrl-btn"
              onClick={toggleCamera}
              title={isCameraOff ? "Turn camera on" : "Turn camera off"}
              >
              <img
                 src={isCameraOff ? no_camera : camera}
                 alt="camera"
                 className="icon"
              />
          </button>

          <button
              className="ctrl-btn screen"
              onClick={toggleScreenShare}
              title={isScreenSharing ? "Stop sharing" : "Share screen"}
          >
            <img
               src={isScreenSharing ? no_screen_share : screen_share}
               alt="screen share"
               className="icon"
            />
         </button>

        </div>
      </div>

      {/* Chat Section */}
  <aside className="chat-panel">
  <h3>Messages</h3>

  <div className="chat-messages">
    {messages.map((msg, index) => (
      <div
        key={index}
        className={
          msg.sender === socketRef.current?.id
            ? "chat-message own"
            : "chat-message"
        }
      >
        <span className="text">{msg.message}</span>
        <span className="time">{msg.time}</span>
      </div>
    ))}
  </div>

  <div className="chat-input">
    <input
      type="text"
      value={messageInput}
      placeholder="Type a message..."
      onChange={(e) => setMessageInput(e.target.value)}
      onKeyDown={(e) => e.key === "Enter" && sendMessage()}
    />
    <button onClick={sendMessage}>Send</button>
  </div>
</aside>
    </div>
  </div>
 );

}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/room/:roomId" element={<Meeting />} />
    </Routes>
  );
}


