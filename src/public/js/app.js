const socket = new WebSocket(`ws://${window.location.host}`);
const messageList = document.querySelector("ul");
const nickForm = document.querySelector("#nickForm");
const messageForm = document.querySelector("#message");


socket.addEventListener("open", () => { console.log("Server is opening") });     //서버가 연결되 있을시 
socket.addEventListener("close", () => { console.log("Server was closed") });    //서버가 닫힐시 

socket.addEventListener("message", (message) => {
    const li = document.createElement("li");
    li.innerText = message.data;
    messageList.append(li);
});    //서버로부터 메세지를 받는다.

function makeMessage(type, payload) {
    const msg = { type, payload };
    return JSON.stringify(msg);
}

const handleNick = (event) => {
    event.preventDefault();
    const input = nickForm.querySelector("input");
    socket.send(makeMessage("nickname", input.value));
    input.value = "";
}

const handleSubmit = (event) => {
    event.preventDefault();
    const input = messageForm.querySelector("input");
    socket.send(makeMessage("new_Message", input.value));
    input.value = "";
}


nickForm.addEventListener("submit", handleNick);
messageForm.addEventListener("submit", handleSubmit);
