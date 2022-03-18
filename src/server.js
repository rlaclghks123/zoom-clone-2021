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

const sockets = [];

wss.on("connection", (socket) => {
    sockets.push(socket);
    socket["nickname"] = "Anonymous";
    console.log("connected to Browser"); //브라우저와 연결 성공시 
    socket.on("close", () => { console.log("Disconnected from the Browser") }); //브라우저 연결이 끊어지면 발생

    socket.on("message", (msg) => {
        const message = JSON.parse(msg);
        switch (message.type) {
            case "new_Message":
                sockets.forEach((aSocket) => aSocket.send(`${socket.nickname}:${message.payload}`));
            case "nickname":
                socket["nickname"] = message.payload;
        }
    });


});
server.listen(3000, handleListen);

