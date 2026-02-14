const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const bcrypt = require("bcrypt");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { 
    cors: { origin: "*" } 
});

// 1. Static Files Setup (public folder)
app.use(express.static(path.join(__dirname, "public")));

// 2. User Database (Hashed Passwords)
const users = {
    Priyansh: bcrypt.hashSync("Priyansh@0702", 10),
    Nirali: bcrypt.hashSync("Nirali@0810", 10)
};

// 3. App State
let chatHistory = [];
let onlineUsers = new Set();

io.on("connection", (socket) => {
    console.log("New user connected:", socket.id);

    // --- LOGIN EVENT ---
    socket.on("login", async ({ username, password }) => {
        if (!users[username]) {
            return socket.emit("errorMsg", "User not found");
        }
        
        const isValid = await bcrypt.compare(password, users[username]);
        if (isValid) {
            socket.username = username;
            onlineUsers.add(username);
            
            socket.emit("loginSuccess");
            
            // Send history to the user who just logged in
            socket.emit("loadHistory", chatHistory);
            
            // Notify everyone about online status
            io.emit("userStatusUpdate", Array.from(onlineUsers));
            console.log(`${username} logged in.`);
        } else {
            socket.emit("errorMsg", "Wrong password");
        }
    });

    // --- MESSAGE EVENT (E2EE) ---
    socket.on("message", (encryptedData) => {
        // Validation: data must exist and user must be logged in
        if (!socket.username || !encryptedData) return;

        const messageData = { 
            user: socket.username, 
            text: encryptedData, // This is the {ct, iv} object from E2EE
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        // Save to history (limit to 200)
        chatHistory.push(messageData);
        if (chatHistory.length > 200) chatHistory.shift(); 
        
        // Broadcast message to everyone
        io.emit("message", messageData);
    });

    // --- DISCONNECT EVENT ---
    socket.on("disconnect", () => {
        if (socket.username) {
            onlineUsers.delete(socket.username);
            io.emit("userStatusUpdate", Array.from(onlineUsers));
            console.log(`${socket.username} disconnected.`);
        }
    });
});

// 4. Server Start
const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server is flying on port ${PORT}`);
});