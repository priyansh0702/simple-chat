const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const bcrypt = require("bcrypt");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static(path.join(__dirname, "public")));

const users = {
    Priyansh: bcrypt.hashSync("Priyansh@0702", 10),
    Nirali: bcrypt.hashSync("Nirali@0810", 10)
};

// Juna messages save karva mate
let chatHistory = [];

io.on("connection", (socket) => {
    socket.on("login", async ({ username, password }) => {
        if (!users[username]) return socket.emit("errorMsg", "User not allowed");
        const valid = await bcrypt.compare(password, users[username]);
        
        if (valid) {
            socket.username = username;
            socket.emit("loginSuccess");
            // Login thaine juna messages load thase
            socket.emit("loadHistory", chatHistory);
        } else {
            socket.emit("errorMsg", "Wrong password");
        }
    });

    socket.on("message", (msg) => {
        if (!socket.username || !msg.trim()) return;
        const msgData = { user: socket.username, text: msg };
        chatHistory.push(msgData);
        if (chatHistory.length > 200) chatHistory.shift(); // Max 200 messages rahese
        io.emit("message", msgData);
    });

    socket.on("markSeen", () => {
        socket.broadcast.emit("userSeen");
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => console.log(`Server on ${PORT}`));