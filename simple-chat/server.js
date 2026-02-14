const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const bcrypt = require("bcrypt");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Public folder mathi static files serve karva mate
app.use(express.static(path.join(__dirname, "public")));

// User Data (Hashed Passwords)
const users = {
    Priyansh: bcrypt.hashSync("Priyansh@0702", 10),
    Nirali: bcrypt.hashSync("Nirali@0810", 10)
};

// Currently ketla loko chat ma che e track karva mate
let activeUsers = {};

io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    // Login logic
    socket.on("login", async ({ username, password }) => {
        // 1. User check
        if (!users[username]) {
            return socket.emit("errorMsg", "User not allowed");
        }

        // 2. Password check
        const valid = await bcrypt.compare(password, users[username]);
        if (!valid) {
            return socket.emit("errorMsg", "Wrong password");
        }

        // 3. Limit check (Only 2 people can chat)
        if (Object.keys(activeUsers).length >= 2 && !activeUsers[username]) {
            return socket.emit("errorMsg", "Chat room is full");
        }

        // User ne active list ma add karo
        activeUsers[username] = socket.id;
        socket.username = username;

        socket.emit("loginSuccess");
        console.log(`${username} logged in.`);
    });

    // Message Handle logic
    socket.on("message", (msg) => {
        if (!socket.username) return;

        // Potana sivay na bija user ne message moklavo
        socket.broadcast.emit("message", {
            user: socket.username,
            text: msg
        });
    });

    // Disconnect logic
    socket.on("disconnect", () => {
        if (socket.username) {
            delete activeUsers[socket.username];
            console.log(`${socket.username} disconnected.`);
        }
    });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});