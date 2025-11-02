// src/services/peerService.js
import Peer from "peerjs";
import { PEER_SERVER_HOST, SOCKET_BASE_URL } from "../constants";

class PeerService {
  constructor() {
    this.peer = null;
    this.localStream = null;
    this.streamCallback = null;
    this.connections = new Map(); // Replaces this.currentCall
    this.bufferedStreams = new Map(); // To buffer early streams
  }

  // init() is almost the same, but the 'call' handler is different
  init(userId) {
    // Avoid re-initializing
    if (this.peer && !this.peer.destroyed) {
      return;
    }

    // If peer was destroyed, set to null so it can be re-created
    if (this.peer?.destroyed) {
      this.peer = null;
    }

    this.peer = new Peer(userId, {
      host: PEER_SERVER_HOST,
      // port: 5001, // use port for local dev
      path: "/peerjs",
      secure: true, // set this to false for local dev
    });

    this.peer.on("call", (call) => {
      // This is an incoming call. Answer it with our local stream.
      call.answer(this.localStream);

      call.on("stream", (remoteStream) => {
        // We received the remote stream
        if (this.streamCallback) {
          this.streamCallback(call.peer, remoteStream); // Pass peerId and stream
        } else {
          console.log("Buffering stream from", call.peer);
          this.bufferedStreams.set(call.peer, remoteStream);
        }
      });

      // Store this new connection
      this.connections.set(call.peer, call);
    });
  }

  // Get and store our local stream
  async getLocalStream(callType = "video") {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: callType === "video",
        audio: true,
      });
      return this.localStream;
    } catch (error) {
      console.error("Error getting local stream:", error);
    }
  }

  // This function replaces 'startCall'. It just calls one peer.
  callPeer(peerId, stream) {
    if (!this.peer || !stream) return;

    const call = this.peer.call(peerId, stream);

    call.on("stream", (remoteStream) => {
      if (this.streamCallback) {
        this.streamCallback(call.peer, remoteStream);
      } else {
        // If modal is NOT ready, buffer stream
        console.log("Buffering stream from", call.peer);
        this.bufferedStreams.set(call.peer, remoteStream);
      }
    });

    this.connections.set(call.peer, call);
  }

  // This handles all incoming streams
  onStreamCallback(cb) {
    this.streamCallback = cb;

    if (this.bufferedStreams.size > 0) {
      console.log("Processing buffered streams...");
      for (const [peerId, stream] of this.bufferedStreams) {
        // Send the buffered stream to the modal
        this.streamCallback(peerId, stream);
      }
      // Clear the buffer
      this.bufferedStreams.clear();
    }
  }

  // Closes a single connection (when one user leaves)
  closeConnection(peerId) {
    if (this.connections.has(peerId)) {
      this.connections.get(peerId).close();
      this.connections.delete(peerId);
    }
  }

  // Closes all connections and stops media (when *we* leave)
  closeAllConnections() {
    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
      this.localStream = null;
    }
    for (const [peerId, connection] of this.connections) {
      connection.close();
    }
    this.connections.clear();
    this.bufferedStreams.clear(); // Clear buffer on exit
    this.streamCallback = null; // Unset the callback

    // Destroy the peer object to be recreated on next call
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
  }
}

const peerService = new PeerService();
export default peerService;
