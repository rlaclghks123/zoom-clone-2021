import http from "http";
import socketIO from "socket.io";
import express from "express";
const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (req, res) => res.render("home"));
app.get("/*", (req, res) => res.redirect("/"));

const httpServer = http.createServer(app);
const webServer = socketIO(httpServer);

function publicRooms() {
    const { sockets: {
        adapter: { sids, rooms }
    } } = webServer;
    const publicRooms = [];
    rooms.forEach((_, key) => {
        if (sids.get(key) === undefined) {
            publicRooms.push(key);
        }
    });
    return publicRooms;
};


webServer.on("connection", (socket) => {
    webServer.sockets.emit("room_change", publicRooms());

    socket.on("disconnect", () => { webServer.sockets.emit("room_change", publicRooms()) });

    socket["nickname"] = "Anonymous";

    socket.on("nickname", (nickname) => {
        socket["nickname"] = nickname;
    })
    socket.on("join_room", (roomname, done) => {
        socket.join(roomname);
        socket.to(roomname).emit("welcome");
        socket.to(roomname).emit("nickname", socket.nickname);
        done();
    });

    socket.on("offer", (offer, roomname) => {
        socket.to(roomname).emit("offer", offer);
    });

    socket.on("answer", (answer, roomname) => {
        socket.to(roomname).emit("answer", answer);
    });

    socket.on("ice", (ice, roomname) => {
        socket.to(roomname).emit("ice", ice);
    });

    socket.on("disconnecting", () => {
        socket.rooms.forEach((room) => {
            socket.to(room).emit("bye", socket.nickname);
        })
    });
});

const handleListen = () => {
    console.log(`Listening on: https://localhost:3000`);
}
httpServer.listen(3000, handleListen);

