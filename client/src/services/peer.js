import Peer from "peerjs";

class PeerService {
  constructor() {
    this.peer = null;
    this.connections = {};
    this.localStream = null;
  }

  async init(userId) {
    if (!this.peer) {
      this.peer = new Peer(userId, {
        host: "localhost",
        port: 9000,
        path: "/peerjs",
        secure: false, // true if using https
      });

      this.peer.on("open", (id) => {
        console.log("PeerJS ID: ", id);
      });

      this.peer.on("call", async (call) => {
        // Answer incoming call with local stream
        if (!this.localStream) {
          this.localStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
        }

        call.answer(this.localStream);

        call.on("stream", (remoteStream) => {
          if (!this.connections[call.peer]) {
            this.connections[call.peer] = call;
          }
          if (this.onStream) this.onStream(call.peer, remoteStream);
        });
      });
    }
  }

  async startCall(peerId) {
    if (!this.localStream) {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
    }

    const call = this.peer.call(peerId, this.localStream);
    call.on("stream", (remoteStream) => {
      if (this.onStream) this.onStream(peerId, remoteStream);
    });
    this.connections[peerId] = call;
  }

  onStreamCallback(callback) {
    this.onStream = callback;
  }

  endCall(peerId) {
    const call = this.connections[peerId];
    if (call) {
      call.close();
      delete this.connections[peerId];
    }
  }

  destroy() {
    if (this.peer) this.peer.destroy();
    this.connections = {};
    this.localStream = null;
  }
}

export default new PeerService();
