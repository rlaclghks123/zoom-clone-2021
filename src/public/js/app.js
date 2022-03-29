const socketIo = io();

const myFace = document.getElementById("myFace");
const muteBtn = document.querySelector("#mute");
const muteI = muteBtn.querySelector("i");
const cameraBtn = document.getElementById("camera");
const cameraI = cameraBtn.querySelector("i");
const cameraSelect = document.getElementById("cameras");
const call = document.getElementById("call");
const chatDiv = document.getElementById("chatroom");
const chatForm = chatDiv.querySelector("form");
const chatContent = chatDiv.querySelector("#chatContent");

call.hidden = true;
chatDiv.hidden = true;
let myStream;
let muted = false;
let cameraOff = false;
let roomname;
let myPeerConnection;
let nickname = "Anonymous";
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
        muted = true;
    } else {
        muted = false;
    }
    muteI.classList = !muted ? "fas fa-volume-mute" : "fas fa-volume-off";
}


function handleCameraClick() {
    myStream.getVideoTracks().forEach((track) => track.enabled = !track.enabled);
    if (cameraOff) {
        cameraOff = false;
    } else {
        cameraOff = true;
    }
    cameraI.classList = !cameraOff ? "fas fa-video-slash" : "fas fa-video";
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
    const name = document.getElementById("name");
    socketIo.emit("nickname", input.value);
    nickname = input.value;
    input.value = "";
    nicknameForm.hidden = true;
    name.innerText = `Hello ${nickname}`

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
const welcome = document.querySelector("#welcome");
async function initCall() {
    welcome.hidden = true;
    call.hidden = false;
    await getMedia();
    makeConnection();
}


async function handleWelcome(e) {
    e.preventDefault();
    const input = createRoomForm.querySelector("input");
    await initCall();
    const h3 = call.querySelector("h3");
    socketIo.emit("join_room", input.value, () => { alert("누군가와 연결이 되면, 대화창이 나타납니다.") });
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
    span.classList.add("span_right");
    chatContent.append(span);
    input.value = "";

}

function handleGet(event) {
    const span = document.createElement("span");
    span.innerText = `${nickname} : ${event.data}`;
    span.classList.add("span_left");
    chatContent.append(span);
}

socketIo.on("offer", async (offer) => {
    chatDiv.hidden = false;
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
    chatDiv.hidden = false;
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




