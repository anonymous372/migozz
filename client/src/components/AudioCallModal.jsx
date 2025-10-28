// client/components/AudioCallModal.jsx

import { useEffect, useRef, useState } from "react";
import peerService from "../services/peerService";
import { Mic, MicOff, PhoneOff, User } from "lucide-react";

const AudioCallModal = ({ open, onClose, friend, userId, isCaller }) => {
  const remoteAudioRef = useRef(null); // We only need a ref for remote audio
  const [isMuted, setIsMuted] = useState(false);

  // useEffect(() => {
  //   if (!open) return;

  //   setIsMuted(false);

  //   const startCall = async () => {
  //     peerService.init(userId);

  //     // --- KEY CHANGE: Request audio only ---
  //     const stream = await navigator.mediaDevices.getUserMedia({
  //       video: false, // <-- Set to false
  //       audio: true,
  //     });
  //     peerService.localStream = stream;

  //     // No local video ref to set

  //     if (isCaller) {
  //       peerService.startCall(friend._id);
  //     }

  //     peerService.onStreamCallback((peerId, remoteStream) => {
  //       // --- KEY CHANGE: Set audio element source ---
  //       if (remoteAudioRef.current)
  //         remoteAudioRef.current.srcObject = remoteStream;
  //     });
  //   };

  //   startCall();

  //   return () => {
  //     if (peerService.localStream)
  //       peerService.localStream.getTracks().forEach((t) => t.stop());
  //     peerService.closeCall();
  //   };
  // }, [open, friend, userId, isCaller]);

  useEffect(() => {
    if (!open) return;

    setIsMuted(false);

    const startCall = async () => {
      // 1. Init PeerJS
      peerService.init(userId);

      // 2. Get local stream from service
      const stream = await peerService.getLocalStream("audio");
      // (No local video ref to set)

      // 3. Call peer if we are the caller
      if (isCaller) {
        // --- THIS IS THE FIX ---
        // Was: peerService.startCall(friend._id);
        peerService.callPeer(friend._id, stream);
      }

      // 4. Handle incoming stream
      peerService.onStreamCallback((peerId, remoteStream) => {
        if (remoteAudioRef.current)
          remoteAudioRef.current.srcObject = remoteStream;
      });
    };

    startCall();

    return () => {
      // 5. Use the new cleanup function
      // peerService.closeAllConnections();
    };
  }, [open, friend, userId, isCaller]);

  const toggleMute = () => {
    if (peerService.localStream) {
      const audioTrack = peerService.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!isMuted);
      }
    }
  };

  const handleLeaveCall = () => {
    peerService.closeAllConnections(); // Explicitly close connections
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl p-8 flex flex-col gap-8 items-center justify-center w-[90%] max-w-md h-[50vh] relative">
        {/* Remote audio element (hidden) */}
        <audio ref={remoteAudioRef} autoPlay />

        {/* Display friend info */}
        <div className="flex flex-col items-center gap-4 text-white">
          <div className="w-32 h-32 rounded-full bg-blue-600 flex items-center justify-center">
            <User className="w-20 h-20" />{" "}
            {/* Or friend.avatar if you have it */}
          </div>
          <h2 className="text-3xl font-semibold">{friend.username}</h2>
          <p className="text-gray-400">Audio Call in Progress...</p>
        </div>

        {/* Control Bar */}
        <div className="flex items-center justify-center gap-6 p-3">
          {/* Mute Button */}
          <button
            onClick={toggleMute}
            className={`p-4 rounded-full text-white transition-colors ${
              isMuted
                ? "bg-red-600 hover:bg-red-700"
                : "bg-gray-600 hover:bg-gray-500"
            }`}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <MicOff className="w-6 h-6" />
            ) : (
              <Mic className="w-6 h-6" />
            )}
          </button>

          {/* Leave Button */}
          <button
            onClick={handleLeaveCall}
            className="p-4 bg-red-600 rounded-full hover:bg-red-700 text-white"
            title="Leave Call"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AudioCallModal;
