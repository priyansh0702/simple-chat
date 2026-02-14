const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const bcrypt = require("bcrypt");
const path = require("path");

const app = express();
const server = http.createServer(app);

// Socket.io setup with CORS for mobile/browser compatibility
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Static files serve karva mate (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, "public")));

// --- USER DATABASE (Hashed Passwords) ---
const users = {
    Priyansh: bcrypt.hashSync("Priyansh@0702", 10),
    Nirali: bcrypt.hashSync("Nirali@0810", 10)
};

// --- CHAT MEMORY (Last 200 Messages) ---
let chatHistory = [];

io.on("connection", (socket) => {
    console.log("User Connected:", socket.id);

    // 1. Handle Login
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
        
        // Login thaye tyare juna messages load karo
        socket.emit("loadHistory", chatHistory);
        console.log(`${username} logged in.`);
    });

    // 2. Handle Messaging
    socket.on("message", (msg) => {
        if (!socket.username || !msg.trim()) return;

        const messageData = {
            user: socket.username,
            text: msg
        };

        // History ma umero ane jo 200 thi vadhe to junu delete karo
        chatHistory.push(messageData);
        if (chatHistory.length > 200) {
            chatHistory.shift();
        }

        // Badha ne message moklo
        io.emit("message", messageData);
    });

    // 3. Handle Seen Status
    socket.on("markSeen", () => {
        if (socket.username) {
            socket.broadcast.emit("userSeen");
        }
    });

    // 4. Handle Disconnect
    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.username);
    });
});

// Port configuration for Render/Local
const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Node.js server is running on port ${PORT}`);
});