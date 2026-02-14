const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const bcrypt = require("bcrypt");
const path = require("path");

const app = express();
const server = http.createServer(app);

// Socket.io setup with CORS (Cross-Origin Resource Sharing)
// Aa Render/Mobile mate bau jaruri che
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Static files (index.html, sounds) serve karva mate
app.use(express.static(path.join(__dirname, "public")));

// User Database - Passwords bcrypt thase login vakhte
const users = {
    Priyansh: bcrypt.hashSync("Priyansh@0702", 10),
    Nirali: bcrypt.hashSync("Nirali@0810", 10)
};

let activeUsers = {};

io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    // --- LOGIN LOGIC ---
    socket.on("login", async ({ username, password }) => {
        // User check
        if (!users[username]) {
            return socket.emit("errorMsg", "User not allowed");
        }

        // Password verify
        try {
            const valid = await bcrypt.compare(password, users[username]);
            if (!valid) {
                return socket.emit("errorMsg", "Wrong password");
            }

            // Success
            socket.username = username;
            activeUsers[username] = socket.id;
            socket.emit("loginSuccess");
            console.log(`${username} logged in successfully.`);
        } catch (err) {
            socket.emit("errorMsg", "Server error during login");
        }
    });

    // --- MESSAGE LOGIC ---
    socket.on("message", (msg) => {
        if (!socket.username) return;

        // io.emit badha ne message mokalshe (including the sender)
        io.emit("message", {
            user: socket.username,
            text: msg
        });
    });

    // --- SEEN LOGIC ---
    socket.on("markSeen", () => {
        if (!socket.username) return;
        // Bija badha ne janavo ke aa message vanchai gayo che
        socket.broadcast.emit("userSeen", { seenBy: socket.username });
    });

    // --- DISCONNECT ---
    socket.on("disconnect", () => {
        if (socket.username) {
            console.log(`${socket.username} disconnected.`);
            delete activeUsers[socket.username];
        }
    });
});

// Render/Deployment mate dynamic PORT selection
// Render potani rite PORT assign karshe, local ma 3000 chalse
const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server active on port: ${PORT}`);
});