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

webServer.on("connection", (socket) => {
    socket.on("join_room", (roomname, done) => {
        socket.join(roomname);
        done();
        socket.to(roomname).emit("welcome");
    });
});



const handleListen = () => {
    console.log(`Listening on: https://localhost:3000`);
}
httpServer.listen(3000, handleListen);

