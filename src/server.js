import express from "express";
import http from "http";
import { instrument } from "@socket.io/admin-ui";
import { Server } from "socket.io";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (req, res) => res.render("home"));
app.get("/*", (req, res) => res.redirect("/"));

const handleListen = () => {
    console.log(`Listening on: https://localhost:3000`);
}

const server = http.createServer(app);
const webServer = new Server(server, {
    cors: {
        origin: ["https://admin.socket.io"],
        credentials: true
    }
});
instrument(webServer, {
    auth: false
});


function countRoom(roomName) {
    return webServer.sockets.adapter.rooms.get(roomName)?.size;
}

const publicRoom = () => {
    const { sockets: { adapter: { sids, rooms } } } = webServer;
    const publicRooms = [];
    rooms.forEach((_, key) => {
        if (sids.get(key) === undefined) {
            publicRooms.push(key);
        }
    });
    return publicRooms;
}

webServer.on("connection", (socket) => {
    socket["nickname"] = "Anonymous"
    socket.onAny((event) => {
        console.log(`Socket Event: ${event}`);
    });
    // enter Room
    socket.on("enter_room", (roomName, done) => {
        socket.join(roomName);
        done();
        socket.to(roomName).emit("welcome", socket.nickname, countRoom(roomName));
        webServer.sockets.emit("room_Change", publicRoom());
    });
    // disconnecting
    socket.on("disconnecting", () => {
        socket.rooms.forEach((room) => socket.to(room).emit("bye", socket.nickname, countRoom(room) - 1));
    });
    // disconnect
    socket.on("disconnect", () => {
        webServer.sockets.emit("room_Change", publicRoom());
    })
    // new Message
    socket.on("new_Message", (msg, roomName, done) => {
        socket.to(roomName).emit("new_Message", `${socket.nickname} : ${msg}`);
        done();
    });
    // nickname
    socket.on("nickname", (nickname) => socket["nickname"] = nickname);


});
server.listen(3000, handleListen);

