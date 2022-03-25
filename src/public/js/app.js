const socketIo = io();

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const cameraSelect = document.getElementById("cameras");
const call = document.getElementById("call");


let myStream;
let muted = false;
let cameraOff = false;
let roomname;
let myPeerConnection;

call.hidden = true;

async function handleCameraChange() {
    await getMedia(cameraSelect.value);
}

async function getCameras() {
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
    })
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

function handleMuteClick() {
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

//welcome form

const welcome = document.getElementById("welcome");
const welcomeForm = welcome.querySelector("form");

async function initCall() {
    welcome.hidden = true;
    call.hidden = false;
    await getMedia();
    makeConnection();
}

async function handleWelcome(e) {
    e.preventDefault();
    const input = welcomeForm.querySelector("input");
    await initCall();
    socketIo.emit("join_room", input.value);
    roomname = input.value;
    input.value = "";
}

welcomeForm.addEventListener("submit", handleWelcome);

socketIo.on("welcome", async () => {
    const offer = await myPeerConnection.createOffer();
    myPeerConnection.setLocalDescription(offer);
    socketIo.emit("offer", offer, roomname);
});

socketIo.on("offer", async (offer) => {
    console.log("received the offer");
    myPeerConnection.setRemoteDescription(offer);
    const answer = await myPeerConnection.createAnswer();
    myPeerConnection.setLocalDescription(answer);
    socketIo.emit("answer", answer, roomname);
    console.log("sent the answer");
});

socketIo.on("answer", (answer) => {
    console.log("received the answer");
    myPeerConnection.setRemoteDescription(answer);

})

socketIo.on("ice", (ice) => {
    console.log("received candidate");
    myPeerConnection.addIceCandidate(ice);
})
//webRTC

function makeConnection() {
    myPeerConnection = new RTCPeerConnection();
    myPeerConnection.addEventListener("icecandidate", handleIce);
    myPeerConnection.addEventListener("addstream", handleAddStream);
    myStream.getTracks().forEach((track) => myPeerConnection.addTrack(track, myStream));
}

function handleIce(data) {
    console.log("sent candidate");
    socketIo.emit("ice", data.candidate, roomname);
}

function handleAddStream(data) {
    const peerFace = document.querySelector("#peerFace");
    peerFace.srcObject = data.stream;
}