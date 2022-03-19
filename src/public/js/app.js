const socket = io();

const welcome = document.querySelector("#welcome");
const form = welcome.querySelector("form");

const handleRoomSubmit = (event) => {
    event.preventDefault();
    const input = form.querySelector("input");
    socket.emit("enter_room", { payload: input.value }, done = () => { console.log("server is done!") });
    input.value = "";
}

form.addEventListener("submit", handleRoomSubmit);