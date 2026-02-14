const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const bcrypt = require("bcrypt");
const path = require("path");

const app = express();
const server = http.createServer(app);

// Socket.io setup with CORS (Render ane Mobile devices mate jaruri)
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Static files (public folder ma index.html ane sounds hova joie)
app.use(express.static(path.join(__dirname, "public")));

// User Data - Priyansh ane Nirali mate
const users = {
    Priyansh: bcrypt.hashSync("Priyansh@0702", 10),
    Nirali: bcrypt.hashSync("Nirali@0810", 10)
};

io.on("connection", (socket) => {
    console.log("New connection:", socket.id);

    // 1. LOGIN EVENT
    socket.on("login", async ({ username, password }) => {
        if (!users[username]) {
            return socket.emit("errorMsg", "User not allowed");
        }

        const valid = await bcrypt.compare(password, users[username]);
        if (!valid) {
            return socket.emit("errorMsg", "Wrong password");
        }

        socket.username = username;
        socket.emit("loginSuccess");
        console.log(`${username} logged in.`);
    });

    // 2. MESSAGE EVENT
    socket.on("message", (msg) => {
        if (!socket.username) return;

        // Akha server par badha ne message mokalshe
        io.emit("message", {
            user: socket.username,
            text: msg
        });
    });

    // 3. SEEN LOGIC
    socket.on("markSeen", () => {
        if (!socket.username) return;
        // Bija user ne notification mokalshe ke message 'Seen' thai gayo che
        socket.broadcast.emit("userSeen");
    });

    socket.on("disconnect", () => {
        if (socket.username) {
            console.log(`${socket.username} disconnected.`);
        }
    });
});

// Port handling for Render/Heroku or Localhost
const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${PORT}`);
});