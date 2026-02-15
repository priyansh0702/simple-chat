const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const bcrypt = require("bcrypt");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { 
    cors: { origin: "*" },
    // Connection stable rakhva mate
    pingTimeout: 60000 
});

app.use(express.static(path.join(__dirname, "public")));

// 1. USER DATABASE
const users = {
    Priyansh: bcrypt.hashSync("Priyansh@0702", 10),
    Nirali: bcrypt.hashSync("Nirali@0810", 10)
};

// 2. STATE
let chatHistory = [];
let onlineUsers = new Set();

io.on("connection", (socket) => {
    console.log("New Connection:", socket.id);

    // LOGIN LOGIC
    socket.on("login", async ({ username, password }) => {
        if (!users[username]) return socket.emit("errorMsg", "User not found");
        
        const isValid = await bcrypt.compare(password, users[username]);
        if (isValid) {
            socket.username = username;
            onlineUsers.add(username);
            
            socket.emit("loginSuccess");
            
            // Junu history load karva mate
            socket.emit("loadHistory", chatHistory);
            
            // Badha ne janavo ke tame online cho
            io.emit("userStatusUpdate", Array.from(onlineUsers));
            console.log(`${username} logged in.`);
        } else {
            socket.emit("errorMsg", "Wrong password");
        }
    });

    // 3. MESSAGE RELAY (ENCRYPTED)
    socket.on("message", (encryptedMsg) => {
        if (!socket.username || !encryptedMsg) return;

        const messageData = { 
            user: socket.username, 
            text: encryptedMsg, // Fakt ciphertext relay thashe
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        // History ma save karo (Max 200 messages)
        chatHistory.push(messageData);
        if (chatHistory.length > 200) chatHistory.shift(); 

        io.emit("message", messageData);
    });

    // 4. DISCONNECT LOGIC
    socket.on("disconnect", () => {
        if (socket.username) {
            onlineUsers.delete(socket.username);
            // Status update moklo jethi "Offline" thai jay
            io.emit("userStatusUpdate", Array.from(onlineUsers));
            console.log(`${socket.username} disconnected.`);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server is flying on port ${PORT}`);
});gi