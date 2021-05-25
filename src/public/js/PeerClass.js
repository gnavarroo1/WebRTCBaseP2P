module.exports = class PeerClass{
    rtcPeerConnection = window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
    rtcSessionDescription = window.mozRTCSessionDescription || window.RTCSessionDescription;
    rtcIceCandidate = window.mozRTCIceCandidate || window.RTCIceCandidate;
    constructor(config) {
        this._peer = this.RTCPeerConnection(config);
    }

    handleStream


}