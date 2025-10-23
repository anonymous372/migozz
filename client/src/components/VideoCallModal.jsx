// src/components/VideoCallModal.jsx
import { useEffect, useRef } from "react";
import peerService from "../services/peerService";

const VideoCallModal = ({ open, onClose, friend, userId }) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const startCall = async () => {
      peerService.init(userId);

      // get local video/audio
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      peerService.localStream = stream;

      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      // start call to friend
      peerService.startCall(friend._id);

      // handle remote stream
      peerService.onStreamCallback((peerId, remoteStream) => {
        if (remoteVideoRef.current)
          remoteVideoRef.current.srcObject = remoteStream;
      });
    };

    startCall();

    return () => {
      if (peerService.localStream)
        peerService.localStream.getTracks().forEach((t) => t.stop());
      peerService.closeCall();
    };
  }, [open, friend, userId]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl p-4 flex gap-4 w-[80%] max-w-4xl relative">
        <div className="flex-1">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            className="w-full rounded-lg"
          />
        </div>
        <div className="flex-1">
          <video ref={remoteVideoRef} autoPlay className="w-full rounded-lg" />
        </div>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-red-600 rounded-full"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default VideoCallModal;
