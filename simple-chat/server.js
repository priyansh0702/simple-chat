const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const bcrypt = require("bcrypt");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Static files (HTML, CSS, JS, Sounds) mate
app.use(express.static(path.join(__dirname, "public")));

// User Database (Priyansh ane Nirali mate)
const users = {
    Priyansh: bcrypt.hashSync("Priyansh@0702", 10),
    Nirali: bcrypt.hashSync("Nirali@0810", 10)
};

// Active users tracking
let activeUsers = {};

io.on("connection", (socket) => {
    console.log("New connection:", socket.id);

    // 1. LOGIN EVENT
    socket.on("login", async ({ username, password }) => {
        // User check
        if (!users[username]) {
            return socket.emit("errorMsg", "User not allowed");
        }

        // Password verify
        const valid = await bcrypt.compare(password, users[username]);
        if (!valid) {
            return socket.emit("errorMsg", "Wrong password");
        }

        // Session store
        activeUsers[username] = socket.id;
        socket.username = username;

        socket.emit("loginSuccess");
        console.log(`${username} is now online.`);
    });

    // 2. MESSAGE EVENT (Real-time broadcasting)
    socket.on("message", (msg) => {
        if (!socket.username) return;

        // io.emit thi badha ne message malse (Sender + Receiver)
        io.emit("message", {
            user: socket.username,
            text: msg
        });
    });

    // 3. SEEN LOGIC
    socket.on("markSeen", () => {
        if (!socket.username) return;
        // Bija user ne janavo ke message vanchai gayo che
        socket.broadcast.emit("userSeen", { seenBy: socket.username });
    });

    // 4. DISCONNECT
    socket.on("disconnect", () => {
        if (socket.username) {
            console.log(`${socket.username} logged out.`);
            delete activeUsers[socket.username];
        }
    });
});

// Port Setting (0.0.0.0 thi network ma koi pan connect thai shakshe)
const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`Local: http://localhost:${PORT}`);
});