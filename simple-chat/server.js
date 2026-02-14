const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const bcrypt = require("bcrypt");
const path = require("path");

const app = express();
const server = http.createServer(app);

// Socket.io setup with CORS support
const io = new Server(server, {
    cors: { origin: "*" }
});

// Static files (HTML, CSS, JS) serve karva mate
app.use(express.static(path.join(__dirname, "public")));

// --- 1. USER DATABASE (Secure Hashed Passwords) ---
const users = {
    Priyansh: bcrypt.hashSync("Priyansh@0702", 10),
    Nirali: bcrypt.hashSync("Nirali@0810", 10)
};

// --- 2. APP STATE ---
let chatHistory = [];
let onlineUsers = new Set(); // Online loka ni list track karva mate

io.on("connection", (socket) => {
    console.log("Connected:", socket.id);

    // --- 3. LOGIN LOGIC ---
    socket.on("login", async ({ username, password }) => {
        // User check karo
        if (!users[username]) {
            return socket.emit("errorMsg", "User not found");
        }

        // Password match karo
        const isValid = await bcrypt.compare(password, users[username]);
        if (isValid) {
            socket.username = username;
            onlineUsers.add(username); // Online list ma umero
            
            socket.emit("loginSuccess");
            socket.emit("loadHistory", chatHistory);
            
            // Badha ne janavo ke koi online aavyu
            io.emit("userStatusUpdate", Array.from(onlineUsers));
            console.log(`${username} logged in.`);
        } else {
            socket.emit("errorMsg", "Wrong password");
        }
    });

    // --- 4. CHAT LOGIC ---
    socket.on("message", (msg) => {
        if (!socket.username || !msg.trim()) return;

        const messageData = {
            user: socket.username,
            text: msg,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        // History ma save karo (Max 200 messages)
        chatHistory.push(messageData);
        if (chatHistory.length > 200) chatHistory.shift();

        // Badha users ne message moklo
        io.emit("message", messageData);
    });

    // --- 5. SEEN LOGIC ---
    socket.on("markSeen", () => {
        if (socket.username) {
            socket.broadcast.emit("userSeen");
        }
    });

    // --- 6. DISCONNECT LOGIC ---
    socket.on("disconnect", () => {
        if (socket.username) {
            onlineUsers.delete(socket.username); // Online list mathi kadhi nakho
            io.emit("userStatusUpdate", Array.from(onlineUsers)); // Status update moklo
            console.log(`${socket.username} disconnected.`);
        }
    });
});

// Port configuration for Render/Localhost
const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server is flying on port ${PORT}`);
});