const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const bcrypt = require("bcrypt");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static(path.join(__dirname, "public")));

// --- USER DATABASE ---
const users = {
    Priyansh: bcrypt.hashSync("Priyansh@0702", 10),
    Nirali: bcrypt.hashSync("Nirali@0810", 10)
};

let chatHistory = [];
let onlineUsers = new Set(); // Online users ne track karva mate

io.on("connection", (socket) => {
    console.log("New Connection:", socket.id);

    // 1. LOGIN LOGIC
    socket.on("login", async ({ username, password }) => {
        if (!users[username]) return socket.emit("errorMsg", "User not found");

        const isValid = await bcrypt.compare(password, users[username]);
        if (isValid) {
            socket.username = username;
            onlineUsers.add(username); // User ne Set ma umero
            
            socket.emit("loginSuccess");
            socket.emit("loadHistory", chatHistory);
            
            // Badha ne janavo ke status badlayu che
            io.emit("userStatusUpdate", Array.from(onlineUsers));
            console.log(`${username} is now Online.`);
        } else {
            socket.emit("errorMsg", "Wrong password");
        }
    });

    // 2. MESSAGE LOGIC
    socket.on("message", (msg) => {
        if (!socket.username || !msg.trim()) return;

        const messageData = { user: socket.username, text: msg };
        chatHistory.push(messageData);
        
        if (chatHistory.length > 200) chatHistory.shift(); 
        io.emit("message", messageData);
    });

    // 3. SEEN LOGIC
    socket.on("markSeen", () => {
        socket.broadcast.emit("userSeen");
    });

    // 4. DISCONNECT (OFFLINE) LOGIC
    socket.on("disconnect", () => {
        if (socket.username) {
            onlineUsers.delete(socket.username); // User ne Set mathi kadhi nakho
            io.emit("userStatusUpdate", Array.from(onlineUsers)); // Status update moklo
            console.log(`${socket.username} is now Offline.`);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${PORT}`);
});