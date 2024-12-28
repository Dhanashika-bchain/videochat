const signalingServer = new WebSocket('ws://localhost:8080');
let localVideo = document.getElementById('localVideo');
let remoteVideo = document.getElementById('remoteVideo');
let username, peerConnection, localStream;

const config = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] // Public STUN server
};

// Login function
function login() {
    username = document.getElementById('username').value;
    document.getElementById('call-controls').style.display = 'block';
    alert(`${username} logged in.`);
}

// Start video call
async function startCall() {
    const callee = document.getElementById('callee').value;
    if (callee === username) {
        alert("You cannot call yourself.");
        return;
    }

    peerConnection = createPeerConnection();
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    signalingServer.send(JSON.stringify({
        type: 'offer',
        offer: offer,
        from: username,
        to: callee
    }));
}

// Create PeerConnection
function createPeerConnection() {
    const pc = new RTCPeerConnection(config);

    pc.onicecandidate = event => {
        if (event.candidate) {
            signalingServer.send(JSON.stringify({
                type: 'candidate',
                candidate: event.candidate,
                from: username
            }));
        }
    };

    pc.ontrack = event => {
        remoteVideo.srcObject = event.streams[0];
    };

    localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
    return pc;
}

// Handle incoming WebSocket messages
signalingServer.onmessage = async (message) => {
    const data = JSON.parse(message.data);

    if (data.to && data.to !== username) return;

    switch (data.type) {
        case 'offer':
            peerConnection = createPeerConnection();
            await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);

            signalingServer.send(JSON.stringify({
                type: 'answer',
                answer: answer,
                from: username,
                to: data.from
            }));
            break;
        case 'answer':
            await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
            break;
        case 'candidate':
            peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
            break;
    }
};

// Get local media stream
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then(stream => {
        localStream = stream;
        localVideo.srcObject = stream;
    })
    .catch(error => console.error('Error accessing media devices:', error));
