const socket = new WebSocket(`ws://${window.location.host}`);

socket.addEventListener("open", () => { console.log("Server is opening") });
socket.addEventListener("close", () => { console.log("Server was closed") });
socket.addEventListener("message", (message) => { console.log("This is from server The ans is", message) });

setTimeout(() => {
    socket.send("This is message from Browser");
}, 10000);