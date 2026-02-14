const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const bcrypt = require("bcrypt");
const path = require("path");

const app = express();
const server = http.createServer(app);

// Socket.io Setup - Mobile ane Render mate CORS jaruri che
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Static files serve karo (public folder)
app.use(express.static(path.join(__dirname, "public")));

// --- USER DATABASE ---
const users = {
    Priyansh: bcrypt.hashSync("Priyansh@0702", 10),
    Nirali: bcrypt.hashSync("Nirali@0810", 10)
};

io.on("connection", (socket) => {
    console.log("User Connected:", socket.id);

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
        console.log(`${username} is now online.`);
    });

    // 2. CHAT LOGIC
    socket.on("message", (msg) => {
        if (!socket.username || !msg.trim()) return;

        // Badha ne message mokalo (Sender + Receiver)
        io.emit("message", {
            user: socket.username,
            text: msg
        });
    });

    // 3. SEEN LOGIC
    socket.on("markSeen", () => {
        if (!socket.username) return;
        // Samavada ne janavo ke message 'Seen' thai gayo che
        socket.broadcast.emit("userSeen");
    });

    // 4. DISCONNECT
    socket.on("disconnect", () => {
        if (socket.username) {
            console.log(`${socket.username} went offline.`);
        }
    });
});

// Port configuration for Render/Local
const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Chat server active on port ${PORT}`);
});