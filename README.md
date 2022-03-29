# CHOOM

Zoom clone using NodeJS, WebRTC and WebSockets

| Feature    | Image                                     |
| ---------- | ----------------------------------------- |
| Home Page  | <img src="img/home.jpg" width="300"><br>  |
| video Page | <img src="img/video.jpg" width="300"><br> |
| solo Page  | <img src="img/solo.jpg" width="300"><br>  |


<hr>

- ## <사용기술>

- - [x] WebRTC
       
        - WebRTC 를 사용하여, Peer To Peer 방식으로 실시간 기능 구현.
        - socket.emit, socket.on을 통하여, 서버와 브라우저간 정보교환
        - navigator.mediaDevices.getUserMedia({audio:true,video:true})}를 통해 video, audio에 접근.
        - navigator.mediaDevices.enumerateDevices() 를 통해 모든 미디어에 접근
        - Signaling(Offer, Answer, Candidate)를 통해 peer to peer 방식으로 연결하여 실시간 기능 구현.
        - Data Chnnel을 활용해, Peer to Peer방식으로 연결하여 chat기능 구현.
  ---
- ## <장점 및 단점>
       
        - 서버를 거치지 않고 peer to peer 방식 이기 때문에, 속도가 아주 빠르다.
        - 소규모 일 경우 아주 빠른기능을 처리 할 수 있지만, 연결이 많아질 수록 비디오를 사용하면 속도가 많이 늦어진다. 따라서 SFU 같은 방식을 사용할 수 있다. 

- ## < RTMP 장점 및 단점>
       
        - 또다른 실시간 구현 방법인 RTMP가 있다.
        - 장점은, WebRTC보다 대규모 스트리밍,실시간 기능을 구현할때 더 좋다.
        - 적은 규모의 스트리밍, 회의일땐 비교적 속도가 느리다.
  ---