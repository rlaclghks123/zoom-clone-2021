import express from "express";
import http from "http";
import socketIO from "socket.io";

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
const webServer = socketIO(server);

webServer.on("connection", (socket) => {
    socket.onAny((event) => {
        console.log(`Socket Event: ${event}`);
    });
    socket.on("enter_room", (roomName, done) => {
        socket.join(roomName);
        done();
        socket.to(roomName).emit("welcome");
    });
    socket.on("disconnecting", () => {
        socket.rooms.forEach((room) => socket.to(room).emit("bye"));
    });
    socket.on("new_Message", (msg, roomName, done) => {
        socket.to(roomName).emit("new_Message", msg);
        done();
    })

});
server.listen(3000, handleListen);

