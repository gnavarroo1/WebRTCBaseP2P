// const PeerClass = require("./PeerClass");
// import('../libraries/sweetalert2/js/sweetalert2.min.js')
const videoGrid = document.getElementById('video-grid');

let socket;
let localStream = new MediaStream();
let peers = {
}
// config
let configuration = {
    iceServers: [{
        'urls': 'stun:stun.l.google.com:19302'
    },
        {
            'urls': "stun:stun1.l.google.com:19302"
        },
        {
            'urls': "stun:stun2.l.google.com:19302"
        }
    ]
}
// input devices constraint
let constraints = {
    audio: true,
    video: true,
}
//
// constraints.video.facingMode = {
//     ideal: "user"
// }
//init camera/audio on startup
function initializeRoom(){
    getConnectedDevices('videoinput', cameras => console.log('Cameras found', cameras));
    getConnectedDevices('audioinput', audio => console.log('Audio found', audio));
    navigator.mediaDevices.getUserMedia(constraints).then(stream => {
            console.log('Local stream started');
            let myVideo = document.getElementById('myVideo');
            myVideo.srcObject = stream;
            localStream = stream;
            for (let track of stream.getTracks()) {
                if (track.kind === "audio" || track.kind === "video")
                    track.enabled = false;
            }
            document.querySelector(
                "#loader").style.display = "none";
            document.querySelector(
                "#container").style.visibility = "visible";
            init();
        }).catch((e) =>{
            console.log(e);
            console.log(e.name + ": " + e.message);
            console.log(e.code);
            if(e.name === 'NotAllowedError' || e.name ==='PermissionDeniedError'){
                document.querySelector(
                    "#loader").style.display = "none";
                // Swal.fire('Any fool can use a computer')

                Swal.fire({
                    icon: 'error',
                    title: "Error de dispositivos de entrada",
                    text: "Se ha denegado el permiso de acceso a los dispositivos de entrada. No se puede iniciar la comunicación.",
                    type: 'warning',
                    // confirmButtonColor: '#3085d6',
                    // cancelButtonColor: '#d33',
                    allowOutsideClick: false,
                    confirmButtonText: 'REINTENTAR'
                }).then((result) => {
                    if(result){
                        window.location.reload();
                    }

                }).catch((e) => {
                    console.log(e)
                })
            }else if(e.name === 'NotFoundError' || e.name ==='DevicesNotFoundError'){

            }
            // alert('getusermedia error ' + e.name)
        });

}
//
// function handleGetUserMediaErrors(type){
//
// }

function getConnectedDevices(type, callback) {
    navigator.mediaDevices.enumerateDevices()
        .then(devices => {
            const filtered = devices.filter(device => device.kind === type);
            callback(filtered);
        });
}




// init sockets

function init(){

    socket = io(signaling_url);
    // socket.on('remove_peer', id => {
    //     handleRemovePeer(id);
    // })

    socket.emit('join-room',ROOM_ID);

    socket.on("answer", (id,answer) => {
        peers[id].pc.setRemoteDescription(new RTCSessionDescription(answer));
    });
    socket.on("candidate", (id,candidate) => {
        const conn = peers[id].pc;
        if(conn) {
            conn.addIceCandidate(new RTCIceCandidate(candidate));
        }
    })

    socket.on('offer',(id,sdp) =>{
        if(!peers.hasOwnProperty(id)){
            peers[id]={
                pc: null,
                audio: true,
                video:true
            }
        }
        peers[id]["pc"] = addPeer(id,localStream);
        // addVideoStream(id);
        // let video = document.getElementById("video-"+id);
        // localStream.getTracks().forEach((track) => {
        //     peers[id].addTrack(track,localStream);
        // })
        // peers[id].onicecandidate = ({ candidate }) => {
        //     candidate && socket.emit('candidate', id , candidate);
        // }
        // video.srcObject = new MediaStream();
        // console.log(video.srcObject);
        // peers[id].ontrack = ({                 streams: [stream]             }) =>  {
        //     video.srcObject = stream;
        //     console.log(video.srcObject);
        // }
        peers[id].pc.setRemoteDescription(new RTCSessionDescription(sdp)).then(() => {
            peers[id].pc.createAnswer().then((answer) => {
                peers[id].pc.setLocalDescription(answer).then(() =>{
                    socket.emit('answer', id, peers[id].pc.localDescription)
                }).catch((e) => {
                    console.log(e);
                })
            }).catch((e) => {
                console.log(e);
            });
        }).catch((e) => {
            console.log(e);
        })
    })

    socket.on(ROOM_ID, (user) => {
        if(!user){
            return;
        }
        const id = user.socket_id;
        if(!peers.hasOwnProperty(id)){
            peers[id]={
                pc: null,
                audio: true,
                video:true
            }
        }
        peers[id].pc = addPeer(id,localStream);
        // peers[id] = new RTCPeerConnection(configuration);
        //
        // let video = document.getElementById("video-"+id);
        // localStream.getTracks().forEach((track) => {
        //     peers[id].addTrack(track,localStream);
        // })
        // peers[id].onicecandidate = ({ candidate }) => {
        //     candidate && socket.emit('candidate', id , candidate);
        // }
        // video.srcObject = new MediaStream();
        // peers[id].ontrack = ({                 streams: [stream]             }) =>  {
        //     video.srcObject = stream;
        //     console.log(video.srcObject);
        // }
        peers[id].pc.createOffer().then((offer) => {
            peers[id].pc.setLocalDescription(offer).then(() =>{
                socket.emit('offer', {
                    id: id,
                    sdp: offer,
                    room: ROOM_ID
                });
            }).catch((err) => {
                console.log(err)
            })
        }).catch((err) => {
            console.log(err)
        })

    })

    // socket.on('disconnect', () => {
    //     for(let [key,value] of peers){
    //         handleRemovePeer(key);
    //     }
    //
    // })
    socket.on('disconnect_peer', (userId) =>{
        if(peers[userId]) {
            handleRemovePeer(userId);
        }
    })
    socket.on("silence-media", (message) =>{
        if(peers.hasOwnProperty(message.socket_id)){
            if(peers[message.socket_id].hasOwnProperty('pc')) {
                document.getElementById('video-'+message.socket_id).srcObject.getTracks().forEach(track =>{
                    if (track.kind === message.type) {
                        track.enabled = message.value;
                    }
                })
            }else{
                if(message.type === 'audio'){
                    peers[message.socket_id].audio = message.value;
                }else{
                    peers[message.socket_id].video = message.value;
                }

            }
        }
    })
    socket.on('end_session',(message) => {
        endSession();
    })
}
// function handleDisconnection(){
//     socket.emit('peer_disconnect', ROOM_ID);
// }

function addPeer(id,local_stream){
    let peer = new RTCPeerConnection(configuration);
    addVideoStream(id);
    let video = document.getElementById("video-"+id);
    local_stream.getTracks().forEach((track) => {

        peer.addTrack(track,local_stream);
    })
    peer.onicecandidate = ({ candidate }) => {
        candidate && socket.emit('candidate', id , candidate);
    }
    peer.ontrack = ({ streams : [stream]}) => {
        video.srcObject = stream;
    }
    return peer;
}

function handleRemovePeer(socket_id){
    document.getElementById("video-" + socket_id).srcObject = null;
    document.getElementById("container-"+socket_id).remove();
    peers[socket_id].pc.close();
    peers[socket_id] = null;
    delete peers[socket_id];
}

function addVideoStream(id){
    if(!document.getElementById("container-"+id)){
        let div = document.createElement('div')
        div.id = "container-"+id;
        div.className = 'formContent';
        let video = document.createElement('video');
        video.id = "video-"+id;
        // video.muted = 'muted';
        video.autoplay = true;
        // video.srcObject = localStream;
        div.append(video);
        let idx = document.getElementById('index');
        if(idx && idx.getAttribute('data-attr')){
            div.innerHTML =div.innerHTML+ (addGlobalSilence(id));
            videoGrid.append(div);
            addGlobalSilenceEventListeners(id);
        }else{
            videoGrid.append(div);
        }

    }
}

function addGlobalSilence(id){
    return '<div id="controls" style="padding-top: 10px">\n' +
        '                        <button id="btnToggleVideo-'+id+'" class="btn btn-circle btn-md btn-danger"><i id="videoIco-'+id+'"\n' +
        '                                                                                                 class="fas fa-video"></i></button>\n' +
        '                        <button id="btnToggleAudio-'+id+'" class="btn btn-circle btn-md btn-danger"><i id="audioIco-'+id+'"\n' +
        '                                                                                                 class="fas fa-microphone"></i></button>\n' +
        '                    </div>';

}
function addGlobalSilenceEventListeners(id){
    document.getElementById("btnToggleVideo-"+id).addEventListener('click', ()=>{
        handleSilence(id,'video')
    })
    document.getElementById("btnToggleAudio-"+id).addEventListener('click', () =>{
        handleSilence(id,'audio')
    })
}

function handleSilence (id,type){
    let icon_id = type+"Ico-" + id;
    let icon = "";
    if(type === 'audio') {
        icon = 'fas fa-microphone';
    }else{
        icon = 'fas fa-video';
    }
    let validator = document.getElementById(icon_id).className === icon;
    if(validator){
        document.getElementById(type+"Ico-"+id).className = icon+'-slash';
    }else{
        document.getElementById(type+"Ico-"+id).className = icon;
    }
    socket.emit('silence',{
        room: ROOM_ID,
        id: id,
        validator: !validator,
        type: type
    });
}
