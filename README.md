🎥 PeerTalk — Real-Time Video Conferencing Web App

PeerTalk is a real-time video conferencing web application built using WebRTC, Socket.IO, and React.
It supports peer-to-peer video calls, audio, screen sharing, and real-time chat using room-based connections.

This project was built to deeply understand real-time communication systems, signaling, and WebRTC behavior in real-world networks.

✨ Features

🔴 Real-time video & audio calling (WebRTC)

🧑‍🤝‍🧑 Room-based meetings using unique URLs

💬 Real-time chat during meetings

🎤 Mute / Unmute microphone

🎥 Camera on / off

🖥️ Screen sharing

❌ End call with cleanup

🌐 Works on local network and same-NAT devices

🧠 How It Works (Architecture)

🎥 PeerTalk — Real-Time Video Conferencing Web App

PeerTalk is a real-time video conferencing web application built using WebRTC, Socket.IO, and React.
It supports peer-to-peer video calls, audio, screen sharing, and real-time chat using room-based connections.

This project was built to deeply understand real-time communication systems, signaling, and WebRTC behavior in real-world networks.

✨ Features

🔴 Real-time video & audio calling (WebRTC)

🧑‍🤝‍🧑 Room-based meetings using unique URLs

💬 Real-time chat during meetings

🎤 Mute / Unmute microphone

🎥 Camera on / off

🖥️ Screen sharing

❌ End call with cleanup

🌐 Works on local network and same-NAT devices

🧠 How It Works (Architecture)

Client (React + Vite)
   │
   │  Socket.IO (signaling)
   ▼
Server (Node.js + Express + Socket.IO)
   │
   │  Offer / Answer / ICE
   ▼
WebRTC PeerConnection (P2P Media)

Socket.IO is used only for signaling (offer, answer, ICE candidates, chat)

WebRTC handles direct peer-to-peer media streaming

Rooms are identified by unique IDs in the URL

🚀 Tech Stack
Frontend

React (Vite)

WebRTC APIs

Socket.IO Client

CSS (custom UI)

Backend

Node.js

Express

Socket.IO

📁 Project Structure

peer-talk/
├── client/          # React frontend
│   ├── src/
│   ├── dist/        # production build
│   └── package.json
├── server/          # Express + Socket.IO backend
│   ├── index.js
│   └── package.json
├── .gitignore
└── README.md

🛠️ Local Setup
1️⃣ Clone the repository
git clone https://github.com/shruti-40619/peer-talk.git
cd peer-talk

2️⃣ Install dependencies

Client

cd client
npm install
npm run dev


Server

cd ../server
npm install
node index.js


Frontend: http://localhost:5173

Backend (signaling): http://localhost:3000

🔗 Creating a Meeting

Open the app in two different browsers or devices

Use the same room URL

Example:

http://localhost:5173/room/abcd1234

⚠️ Known Limitations (Important)

❗ TURN server is NOT implemented

Works reliably when:

Both users are on the same network, OR

NAT conditions allow direct P2P connection

In strict NAT / mobile networks:

Chat works ✅

Video/audio may fail ❌ (expected without TURN)

This is a known WebRTC limitation and not a bug.

🔮 Future Improvements

Add TURN server for reliable global connectivity

Meeting lobby & join screen

Authentication

Better UI/UX polish

Deployment on cloud (Render / Railway)

🧑‍💻 Why This Project Matters

This project focuses on real WebRTC engineering, not just tutorials:

Signaling vs media separation

NAT traversal issues

Deployment challenges

Debugging real-world failures

It demonstrates practical understanding of real-time systems, not just APIs.

📜 License

MIT License
