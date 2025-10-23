// src/services/peerService.js
import Peer from "peerjs";

class PeerService {
  constructor() {
    this.peer = null;
    this.localStream = null;
    this.currentCall = null;
    this.streamCallback = null;
  }

  init(userId) {
    if (this.peer) return;

    this.peer = new Peer(userId, {
      host: "localhost",
      port: 9000,
      path: "/peerjs",
      secure: false,
    });

    this.peer.on("call", (call) => {
      call.answer(this.localStream); // answer with local stream
      call.on("stream", (remoteStream) => {
        if (this.streamCallback) this.streamCallback(call.peer, remoteStream);
      });
      this.currentCall = call;
    });
  }

  startCall(friendId) {
    if (!this.peer || !this.localStream) return;
    const call = this.peer.call(friendId, this.localStream);
    call.on("stream", (remoteStream) => {
      if (this.streamCallback) this.streamCallback(friendId, remoteStream);
    });
    this.currentCall = call;
  }

  onStreamCallback(cb) {
    this.streamCallback = cb;
  }

  closeCall() {
    if (this.currentCall) this.currentCall.close();
    this.currentCall = null;
    this.localStream = null;
  }
}

const peerService = new PeerService();
export default peerService;
