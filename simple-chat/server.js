const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const bcrypt = require("bcrypt");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

const users = {
    rahul: bcrypt.hashSync("1234", 10),
    priya: bcrypt.hashSync("5678", 10)
};

let activeUsers = {};

io.on("connection", (socket) => {

    socket.on("login", async ({ username, password }) => {

        if (!users[username]) {
            return socket.emit("errorMsg", "User not allowed");
        }

        const valid = await bcrypt.compare(password, users[username]);
        if (!valid) {
            return socket.emit("errorMsg", "Wrong password");
        }

        if (Object.keys(activeUsers).length >= 2) {
            return socket.emit("errorMsg", "Chat already in use");
        }

        activeUsers[username] = socket.id;
        socket.username = username;

        socket.emit("loginSuccess");
    });

    socket.on("message", (msg) => {
        if (!socket.username) return;

        socket.broadcast.emit("message", {
            user: socket.username,
            text: msg
        });
    });

    socket.on("disconnect", () => {
        if (socket.username) {
            delete activeUsers[socket.username];
        }
    });

});

const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () => {
    console.log("Server running on port " + PORT);
});
