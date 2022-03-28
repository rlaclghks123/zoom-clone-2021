const socketIo = io();

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const cameraSelect = document.getElementById("cameras");
const call = document.getElementById("call");
const chatDiv = document.getElementById("chatroom");
const chatForm = chatDiv.querySelector("form");
const chatContent = chatDiv.querySelector("#chatContent");

call.hidden = true;

let myStream;
let muted = false;
let cameraOff = false;
let roomname;
let myPeerConnection;
let nickname;
let myDataChannel

async function getCameras() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const camera = devices.filter((device) => device.kind === "videoinput");
        const currentCamera = myStream.getVideoTracks()[0];
        camera.forEach((camera) => {
            const option = document.createElement("option");
            option.value = camera.deviceId;
            option.innerText = camera.label;
            if (currentCamera.label === camera.label) {
                option.selected = true;
            }
            cameraSelect.appendChild(option);
        });
    }
    catch (error) {
        console.log(error);
    }
}

async function handleCameraChange() {
    await getMedia(cameraSelect.value);
    if (myPeerConnection) {
        const videoTrack = myStream.getVideoTracks()[0];
        const videoSender = myPeerConnection.getSender().find((sender) => sender.track.kind === "video");
        videoSender.replaceTack(videoTrack);
    }
}



async function getMedia(deviceId) {
    const initialConstrains = { audio: true, video: { facingMode: "user" } };
    const cameraConstrains = { audio: true, deviceId: { exact: deviceId } };
    try {
        myStream = await navigator.mediaDevices.getUserMedia(
            deviceId ? cameraConstrains : initialConstrains
        );
        myFace.srcObject = myStream;
        if (!deviceId) {
            await getCameras();
        }
    } catch (error) {
        console.log(error);
    }
}

async function handleMuteClick() {
    myStream.getAudioTracks().forEach((track) => track.enabled = !track.enabled);
    if (!muted) {
        muteBtn.innerText = "Unmute";
        muted = true;
    } else {
        muteBtn.innerText = "Mute";
        muted = false;
    }
}


function handleCameraClick() {
    myStream.getVideoTracks().forEach((track) => track.enabled = !track.enabled);
    if (cameraOff) {
        cameraBtn.innerText = "Turn Camera Off";
        cameraOff = false;
    } else {
        cameraBtn.innerText = "Turn Camera On";
        cameraOff = true;
    }
}



muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
cameraSelect.addEventListener("input", handleCameraChange);

//nickname form
const nicknameDiv = document.getElementById("nickname");
const nicknameForm = nicknameDiv.querySelector("form");

function handleNickname(e) {
    e.preventDefault();
    const input = nicknameForm.querySelector("input");
    socketIo.emit("nickname", input.value);
    nickname = input.value;
    input.value = "";
}

function addMessage(nickname) {
    const span = document.createElement("span");
    span.innerText = `${nickname} 이 입장했습니다.`;
    chatContent.append(span);
}

socketIo.on("nickname", addMessage);
nicknameForm.addEventListener("submit", handleNickname);

// chat form


//welcome form

const createRoom = document.getElementById("createRoom");
const createRoomForm = createRoom.querySelector("form");

async function initCall() {
    createRoom.hidden = true;
    nicknameDiv.hidden = true;
    call.hidden = false;
    await getMedia();
    makeConnection();
}


async function handleWelcome(e) {
    e.preventDefault();
    const input = createRoomForm.querySelector("input");
    await initCall();
    const h3 = call.querySelector("h3");
    socketIo.emit("join_room", input.value);
    roomname = input.value;
    h3.innerText = `Room : ${roomname}`;
    input.value = "";
}

createRoomForm.addEventListener("submit", handleWelcome);

socketIo.on("welcome", async () => {
    myDataChannel = myPeerConnection.createDataChannel("chat");
    myDataChannel.addEventListener("open", () => {
        chatForm.addEventListener("submit", handleSend);
    });
    myDataChannel.addEventListener("message", handleGet);
    const offer = await myPeerConnection.createOffer();
    myPeerConnection.setLocalDescription(offer);
    socketIo.emit("offer", offer, roomname);
});

socketIo.on("bye", (nickname) => {
    const span = document.createElement("span");
    span.innerText = `${nickname} 님이 퇴장하셨습니다.`;
    chatContent.append(span);
});

function handleSend(event) {
    event.preventDefault();
    const input = chatForm.querySelector("input");
    const value = input.value;
    myDataChannel.send(value);
    const span = document.createElement("span");
    span.innerText = `${nickname} : ${event.data}`;
    span.innerText = `You: ${value}`;
    chatContent.append(span);
    input.value = "";
}

function handleGet(event) {
    const span = document.createElement("span");
    span.innerText = `${nickname} : ${event.data}`;
    chatContent.append(span);
}

socketIo.on("offer", async (offer) => {
    myPeerConnection.addEventListener("datachannel", (event) => {
        myDataChannel = event.channel;
        myDataChannel.addEventListener("open", () => {
            chatForm.addEventListener("submit", handleSend);
        });
        myDataChannel.addEventListener("message", handleGet);
    });
    myPeerConnection.setRemoteDescription(offer);
    const answer = await myPeerConnection.createAnswer();
    myPeerConnection.setLocalDescription(answer);
    socketIo.emit("answer", answer, roomname);
});

socketIo.on("answer", (answer) => {
    myPeerConnection.setRemoteDescription(answer);

})

socketIo.on("ice", (ice) => {
    myPeerConnection.addIceCandidate(ice);
})
//webRTC

function makeConnection() {
    myPeerConnection = new RTCPeerConnection({
        iceServers: [
            {
                urls: [
                    "stun:stun.l.google.com:19302",
                    "stun:stun1.l.google.com:19302",
                    "stun:stun2.l.google.com:19302",
                    "stun:stun3.l.google.com:19302",
                ],
            },
        ],
    });
    myPeerConnection.addEventListener("icecandidate", handleIce);
    myPeerConnection.addEventListener("addstream", handleAddStream);
    // myPeerConnection.addEventListener("track", handleTrack)


    myStream.getTracks().forEach((track) => myPeerConnection.addTrack(track, myStream));
}

function handleIce(data) {
    socketIo.emit("ice", data.candidate, roomname);
}

function handleAddStream(data) {
    const peerFace = document.querySelector("#peerFace");
    peerFace.srcObject = data.stream;
}
// function handleTrack(data) {
//     console.log("handle track")
//     const peerFace = document.querySelector("#peerFace")
//     peerFace.srcObject = data.streams[0]
// }




