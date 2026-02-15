const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const bcrypt = require("bcrypt");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static(path.join(__dirname, "public")));

// USER DATABASE
const users = {
    Priyansh: bcrypt.hashSync("Priyansh@0702", 10),
    Nirali: bcrypt.hashSync("Nirali@0810", 10)
};

let chatHistory = [];
let onlineUsers = new Set();

io.on("connection", (socket) => {
    socket.on("login", async ({ username, password }) => {
        if (!users[username]) return socket.emit("errorMsg", "User not found");
        
        const isValid = await bcrypt.compare(password, users[username]);
        if (isValid) {
            socket.username = username;
            onlineUsers.add(username);
            
            socket.emit("loginSuccess");
            socket.emit("loadHistory", chatHistory);
            
            // Immediately update everyone on who is online
            io.emit("userStatusUpdate", Array.from(onlineUsers));
        } else {
            socket.emit("errorMsg", "Wrong password");
        }
    });

    socket.on("message", (encryptedMsg) => {
        if (!socket.username || !encryptedMsg) return;
        const messageData = { 
            user: socket.username, 
            text: encryptedMsg, 
            time: new Date().toLocaleTimeString() 
        };
        chatHistory.push(messageData);
        if (chatHistory.length > 200) chatHistory.shift(); 
        io.emit("message", messageData);
    });

    socket.on("disconnect", () => {
        if (socket.username) {
            onlineUsers.delete(socket.username);
            io.emit("userStatusUpdate", Array.from(onlineUsers));
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${PORT}`);
});