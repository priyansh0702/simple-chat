const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const bcrypt = require("bcrypt");
const path = require("path");

const app = express();
const server = http.createServer(app);

// Socket.io Setup - CORS logic sathe jethi mobile ma problem na ave
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Static files (HTML, CSS, JS) serve karva mate
app.use(express.static(path.join(__dirname, "public")));

// --- USER DATABASE ---
const users = {
    Priyansh: bcrypt.hashSync("Priyansh@0702", 10),
    Nirali: bcrypt.hashSync("Nirali@0810", 10)
};

// --- MESSAGE HISTORY ---
// Aa array ma 200 messages save raheshe
let chatHistory = [];

io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    // 1. LOGIN LOGIC
    socket.on("login", async ({ username, password }) => {
        if (!users[username]) {
            return socket.emit("errorMsg", "User not found");
        }

        const isValid = await bcrypt.compare(password, users[username]);
        if (!isValid) {
            return socket.emit("errorMsg", "Wrong password");
        }

        socket.username = username;
        socket.emit("loginSuccess");
        
        // Login thaye tyare juna messages moklo
        socket.emit("loadHistory", chatHistory);
        console.log(`${username} is now online.`);
    });

    // 2. CHAT LOGIC
    socket.on("message", (msg) => {
        if (!socket.username || !msg.trim()) return;

        const messageData = {
            user: socket.username,
            text: msg
        };

        // History ma save karo
        chatHistory.push(messageData);

        // Jo 200 thi vadhi jay to peilo (juno) delete karo
        if (chatHistory.length > 200) {
            chatHistory.shift();
        }

        // Badha ne message mokalo
        io.emit("message", messageData);
    });

    // 3. SEEN LOGIC
    socket.on("markSeen", () => {
        if (!socket.username) return;
        // Samavada ne janavo ke message 'Seen' thayo che
        socket.broadcast.emit("userSeen");
    });

    // 4. DISCONNECT
    socket.on("disconnect", () => {
        if (socket.username) {
            console.log(`${socket.username} went offline.`);
        }
    });
});

// Port configuration (Render mate process.env.PORT jaruri che)
const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Chat server active on port ${PORT}`);
});