const socket = io();

const welcome = document.querySelector("#welcome");
const roomnameform = welcome.querySelector("#roomnameForm");
const nicknameForm = document.querySelector("#nicknameForm");
const room = document.querySelector("#room");

let roomName;

room.hidden = true;

const addMessage = (msg) => {
    const ul = room.querySelector("ul");
    const li = document.createElement("li");
    li.innerText = msg;
    ul.appendChild(li);
}

const handleMessageSubmit = (event) => {
    event.preventDefault();
    const input = room.querySelector("input");
    const value = input.value;
    socket.emit("new_Message", value, roomName, () => {
        addMessage(`You: ${value}`);
    });
    input.value = "";
}

const showRoom = () => {
    welcome.hidden = true;
    room.hidden = false;
    const h3 = room.querySelector("h3");
    h3.innerText = `Room ${roomName}`;
    const form = room.querySelector("form");
    form.addEventListener("submit", handleMessageSubmit);
    nicknameForm.addEventListener("submit", handleNicknameSubmit);
}

const handleNicknameSubmit = (event) => {
    event.preventDefault();
    const input = nicknameForm.querySelector("input");
    const value = input.value;
    socket.emit("nickname", value);
    input.value = "";
}

const handleRoomSubmit = (event) => {
    event.preventDefault();
    const input = roomnameform.querySelector("input");
    socket.emit("enter_room", input.value, showRoom);
    roomName = input.value;
    input.value = "";
}

roomnameform.addEventListener("submit", handleRoomSubmit);

socket.on("welcome", (user, roomCount) => {
    const h3 = room.querySelector("h3");
    h3.innerText = `Room ${roomName} (${roomCount} 명)`;
    addMessage(`${user} arrived!`);
});

socket.on("bye", (user, roomCount) => {
    const h3 = room.querySelector("h3");
    h3.innerText = `Room ${roomName} (${roomCount} 명)`;
    addMessage(`${user} left!`);
});

socket.on("new_Message", addMessage);

socket.on("room_Change", (rooms) => {
    const roomList = welcome.querySelector("ul");
    roomList.innerHTML = "";
    rooms.forEach((room) => {
        const li = document.createElement("li");
        li.innerText = room;
        if (room.length === 0) {
            return;
        }
        roomList.append(li);
    })
})
