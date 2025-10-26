import { useEffect, useRef, useState } from "react";
import peerService from "../services/peerService";
import { Mic, MicOff, Video, VideoOff, PhoneOff } from "lucide-react";

const VideoCallModal = ({ open, onClose, friend, userId, isCaller }) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  useEffect(() => {
    if (!open) return;

    setIsMuted(false);
    setIsVideoOff(false);

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

  const toggleVideo = () => {
    if (peerService.localStream) {
      const videoTrack = peerService.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!isVideoOff);
      }
    }
  };

  const handleLeaveCall = () => {
    onClose();
  };

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
          {isVideoOff && (
            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
              <VideoOff className="w-16 h-16 text-gray-600" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <video ref={remoteVideoRef} autoPlay className="w-full rounded-lg" />
        </div>
        {/* <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-red-600 rounded-full"
        >
          Close
        </button> */}
      </div>
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center justify-center gap-4 p-3 bg-gray-800 bg-opacity-75 rounded-full shadow-lg">
        {/* Mute Button */}
        <button
          onClick={toggleMute}
          className={`p-3 rounded-full text-white transition-colors ${
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

        {/* Video Button */}
        <button
          onClick={toggleVideo}
          className={`p-3 rounded-full text-white transition-colors ${
            isVideoOff
              ? "bg-red-600 hover:bg-red-700"
              : "bg-gray-600 hover:bg-gray-500"
          }`}
          title={isVideoOff ? "Turn Video On" : "Turn Video Off"}
        >
          {isVideoOff ? (
            <VideoOff className="w-6 h-6" />
          ) : (
            <Video className="w-6 h-6" />
          )}
        </button>

        {/* Leave Button */}
        <button
          onClick={handleLeaveCall}
          className="p-3 bg-red-600 rounded-full hover:bg-red-700 text-white"
          title="Leave Call"
        >
          <PhoneOff className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default VideoCallModal;
