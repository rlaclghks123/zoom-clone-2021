import express from "express";
import http from "http";
import websocket from "ws";

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
const wss = new websocket.Server({ server });

wss.on("connection", (socket) => {
    console.log("connected to Browser"); //브라우저와 연결 성공시 

    socket.on("message", (message) => {
        console.log(`message : ${message} from frontEnd`); //브라우저에서 보내는 메세지를 받는다.
    });

    socket.send("Hello!");
    socket.on("close", () => { console.log("Disconnected from the Browser") }); //브라우저 연결이 끊어지면 발생
});
server.listen(3000, handleListen);

