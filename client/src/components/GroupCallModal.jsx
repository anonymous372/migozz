import { useEffect, useRef, useState } from "react";
import peerService from "../services/peerService";
import socketService from "../services/socket";
import { Mic, MicOff, Video, VideoOff, PhoneOff, User } from "lucide-react";

// Video tile for each participant
// const VideoTile = ({ stream, isMuted, isLocal, name, isVideoOff }) => {
//   const videoRef = useRef(null);

//   useEffect(() => {
//     if (videoRef.current) {
//       videoRef.current.srcObject = stream;
//     }
//   }, [stream]);

//   return (
//     <div className="bg-gray-700 rounded-lg overflow-hidden aspect-video relative">
//       <video
//         ref={videoRef}
//         autoPlay
//         muted={isMuted}
//         className="w-full h-full object-cover"
//       />
//       <span className="absolute bottom-2 left-2 text-white bg-black bg-opacity-50 px-2 py-1 rounded text-sm">
//         {name} {isLocal ? "(You)" : ""}
//       </span>
//       {/* Show icon if their video is off */}
//       {(isVideoOff || !stream?.getVideoTracks()[0]?.enabled) && (
//         <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
//           <User className="w-16 h-16 text-gray-500" />
//         </div>
//       )}
//       {/* Show mic icon if they are muted (logic not fully implemented for remote users) */}
//       {/* {isMuted && !isLocal && (
//         <MicOff className="absolute top-2 right-2 text-white" />
//       )} */}
//     </div>
//   );
// };
// const VideoTile = ({
//   stream,
//   isMuted,
//   isLocal,
//   name,
//   isVideoOff,
//   callType,
// }) => {
//   const videoRef = useRef(null);
//   const [isRemoteMuted, setIsRemoteMuted] = useState(false);
//   const [isRemoteVideoOff, setIsRemoteVideoOff] = useState(false);

//   useEffect(() => {
//     if (videoRef.current) {
//       videoRef.current.srcObject = stream;
//     }

//     // If this is a remote stream, add event listeners
//     if (stream && !isLocal) {
//       // Audio track
//       const audioTrack = stream.getAudioTracks()[0];
//       if (audioTrack) {
//         const handleAudioMute = () => setIsRemoteMuted(!audioTrack.enabled);
//         audioTrack.addEventListener("mute", handleAudioMute);
//         audioTrack.addEventListener("unmute", handleAudioMute);
//         setIsRemoteMuted(!audioTrack.enabled); // Set initial state

//         return () => {
//           audioTrack.removeEventListener("mute", handleAudioMute);
//           audioTrack.removeEventListener("unmute", handleAudioMute);
//         };
//       }

//       // Video track
//       const videoTrack = stream.getVideoTracks()[0];
//       if (videoTrack) {
//         const handleVideoMute = () => setIsRemoteVideoOff(!videoTrack.enabled);
//         videoTrack.addEventListener("mute", handleVideoMute);
//         videoTrack.addEventListener("unmute", handleVideoMute);
//         setIsRemoteVideoOff(!videoTrack.enabled); // Set initial state

//         return () => {
//           videoTrack.removeEventListener("mute", handleVideoMute);
//           videoTrack.removeEventListener("unmute", handleVideoMute);
//         };
//       }
//     }
//   }, [stream, isLocal]);

//   // Determine final video off state
//   const videoIsOff = isLocal ? isVideoOff : isRemoteVideoOff;

//   return (
//     <div className="bg-gray-700 rounded-lg overflow-hidden aspect-video relative">
//       <video
//         ref={videoRef}
//         autoPlay
//         muted={isMuted} // Only local stream is muted for us
//         className="w-full h-full object-cover"
//       />
//       <span className="absolute bottom-2 left-2 text-white bg-black bg-opacity-50 px-2 py-1 rounded text-sm z-10">
//         {name} {isLocal ? "(You)" : ""}
//       </span>

//       {/* Show icon if their video is off (and it's a video call) */}
//       {videoIsOff && callType === "video" && (
//         <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
//           <User className="w-16 h-16 text-gray-500" />
//         </div>
//       )}

//       {/* Show icon if they are muted (and not local) */}
//       {isRemoteMuted && !isLocal && (
//         <MicOff className="absolute top-2 right-2 text-white bg-black bg-opacity-25 rounded-full p-1 z-10" />
//       )}
//     </div>
//   );
// };

// const VideoTile = ({
//   stream,
//   isMuted,
//   isLocal,
//   name,
//   isVideoOff,
//   callType,
// }) => {
//   const videoRef = useRef(null);
//   const [isRemoteMuted, setIsRemoteMuted] = useState(false);
//   const [isRemoteVideoOff, setIsRemoteVideoOff] = useState(false);

//   useEffect(() => {
//     if (videoRef.current) {
//       videoRef.current.srcObject = stream;
//     }

//     // --- Variables to hold cleanup functions ---
//     let cleanupAudio = () => {};
//     let cleanupVideo = () => {};

//     // If this is a remote stream, add event listeners
//     if (stream && !isLocal) {
//       // Audio track
//       const audioTrack = stream.getAudioTracks()[0];
//       if (audioTrack) {
//         const handleAudioMute = () => setIsRemoteMuted(!audioTrack.enabled);
//         audioTrack.addEventListener("mute", handleAudioMute);
//         audioTrack.addEventListener("unmute", handleAudioMute);
//         setIsRemoteMuted(!audioTrack.enabled); // Set initial state

//         // Assign cleanup for audio
//         cleanupAudio = () => {
//           audioTrack.removeEventListener("mute", handleAudioMute);
//           audioTrack.removeEventListener("unmute", handleAudioMute);
//         };
//       } else {
//         setIsRemoteMuted(false); // Default if no audio track
//       }

//       // Video track
//       const videoTrack = stream.getVideoTracks()[0];
//       if (videoTrack) {
//         const handleVideoMute = () => setIsRemoteVideoOff(!videoTrack.enabled);
//         videoTrack.addEventListener("mute", handleVideoMute);
//         videoTrack.addEventListener("unmute", handleVideoMute);
//         setIsRemoteVideoOff(!videoTrack.enabled); // Set initial state

//         // Assign cleanup for video
//         cleanupVideo = () => {
//           videoTrack.removeEventListener("mute", handleVideoMute);
//           videoTrack.removeEventListener("unmute", handleVideoMute);
//         };
//       } else {
//         setIsRemoteVideoOff(true); // Default to off if no video track
//       }
//     }

//     // --- Return the combined cleanup function ---
//     return () => {
//       cleanupAudio();
//       cleanupVideo();
//     };
//   }, [stream, isLocal]); // Dependencies are correct

//   // Determine final video off state
//   const videoIsOff = isLocal ? isVideoOff : isRemoteVideoOff;

//   return (
//     <div className="bg-gray-700 rounded-lg overflow-hidden aspect-video relative">
//       <video
//         ref={videoRef}
//         autoPlay
//         muted={isMuted} // Only local stream is muted for us
//         className="w-full h-full object-cover"
//       />
//       <span className="absolute bottom-2 left-2 text-white bg-black bg-opacity-50 px-2 py-1 rounded text-sm z-10">
//         {name} {isLocal ? "(You)" : ""}
//       </span>

//       {/* Show icon if their video is off (and it's a video call) */}
//       {videoIsOff && callType === "video" && (
//         <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
//           <User className="w-16 h-16 text-gray-500" />
//         </div>
//       )}

//       {/* Show icon if they are muted (and not local) */}
//       {isRemoteMuted && !isLocal && (
//         <MicOff className="absolute top-2 right-2 text-white bg-black bg-opacity-25 rounded-full p-1 z-10" />
//       )}
//     </div>
//   );
// };

const VideoTile = ({
  stream,
  isLocal,
  name,
  // Local states:
  isLocalMuted,
  isLocalVideoOff,
  // Signaled remote states:
  isRemoteAudioEnabled,
  isRemoteVideoEnabled,
  callType,
}) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
    // No need for track listeners here anymore, state is signaled
  }, [stream]);

  // Determine final states based on local or signaled remote
  const audioIsEnabled = isLocal ? !isLocalMuted : isRemoteAudioEnabled;
  const videoIsEnabled = isLocal ? !isLocalVideoOff : isRemoteVideoEnabled;

  return (
    <div className="bg-gray-700 rounded-lg overflow-hidden aspect-video relative">
      <video
        ref={videoRef}
        autoPlay
        muted={isLocal} // Only mute local stream for ourselves
        className="w-full h-full object-cover"
      />
      <span className="absolute bottom-2 left-2 text-white bg-black bg-opacity-50 px-2 py-1 rounded text-sm z-10">
        {name} {isLocal ? "(You)" : ""}
      </span>

      {/* Show icon if video is off (and it's a video call) */}
      {!videoIsEnabled && callType === "video" && (
        <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
          <User className="w-16 h-16 text-gray-500" />
        </div>
      )}

      {/* Show icon if audio is off */}
      {!audioIsEnabled && (
        <MicOff className="absolute top-2 right-2 text-white bg-black bg-opacity-25 rounded-full p-1 z-10" />
      )}
    </div>
  );
};

const GroupCallModal = ({
  open,
  callInfo,
  onClose,
  user,
  callType,
  members,
}) => {
  // Store remote streams in state: { peerId: '123', stream: MediaStream }
  const [remoteStreams, setRemoteStreams] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [hasCallBeenActive, setHasCallBeenActive] = useState(false);

  const [remoteTrackStates, setRemoteTrackStates] = useState({});

  useEffect(() => {
    if (!open) return;

    setRemoteStreams([]);
    setRemoteTrackStates({}); // Clear remote states
    setHasCallBeenActive(false);

    // --- 1. Get Local Stream ---
    peerService.getLocalStream(callType).then((localStream) => {
      // Local stream is handled by peerService
    });

    // --- 2. Set up stream callback ---
    // This is how we receive streams from *other* users
    peerService.onStreamCallback((peerId, stream) => {
      console.log("Receiving stream from", peerId);
      setRemoteStreams((prev) => {
        // Avoid duplicates
        if (prev.find((s) => s.peerId === peerId)) return prev;
        return [...prev, { peerId, stream }];
      });
      setRemoteTrackStates((prev) => ({
        ...prev,
        [peerId]: { audio: true, video: true },
      }));
      setHasCallBeenActive(true);
    });

    // --- Listen for track state changes from others ---
    const handleTrackStateChange = (data) => {
      // data: { peerId, trackType, isEnabled }
      if (data.peerId !== user._id) {
        setRemoteTrackStates((prev) => ({
          ...prev,
          [data.peerId]: {
            ...(prev[data.peerId] || { audio: true, video: true }), // Keep existing state
            [data.trackType]: data.isEnabled, // Update the specific track
          },
        }));
      }
    };
    socketService.onTrackStateChanged(handleTrackStateChange);

    // --- 3. Set up member left callback ---
    const handleMemberLeft = (data) => {
      if (data.roomId === callInfo.roomId) {
        console.log("Member left, removing stream:", data.userId);
        peerService.closeConnection(data.userId); // Close peer connection
        setRemoteStreams((prev) =>
          prev.filter((s) => s.peerId !== data.userId)
        ); // Remove from UI
        // Remove their track state
        setRemoteTrackStates((prev) => {
          const newState = { ...prev };
          delete newState[data.userId];
          return newState;
        });
      }
    };

    socketService.onGroupCallMemberLeft(handleMemberLeft);

    return () => {
      // Clean up on modal close
      //   peerService.closeAllConnections();
      setRemoteStreams([]);
      setRemoteTrackStates({});
      socketService.off("group_call_member_left", handleMemberLeft);
      socketService.off("track_state_changed", handleTrackStateChange);
    };
  }, [open, callType, callInfo.roomId, user._id]);

  //   useEffect(() => {
  //     // If we are the only member left in the call, close it.
  //     if (members && members.length === 1 && members[0] === user._id) {
  //       onClose(); // This will trigger handleLeaveGroupCall
  //     }
  //     // Also handle the case where the caller is alone and the
  //     // last other member leaves (not rejects)
  //     if (remoteStreams.length > 0 && members.length === 1) {
  //       onClose();
  //     }
  //   }, [members, remoteStreams, user._id, onClose]);

  useEffect(() => {
    // If the call was once active (had >1 person)
    // AND now the members list has shrunk to 1 (only us)
    if (hasCallBeenActive && members.length === 1 && members[0] === user._id) {
      onClose(); // This will trigger handleLeaveGroupCall in HomePage
    }
  }, [members, hasCallBeenActive, user._id, onClose]);

  // --- 4. Toggle Mute/Video ---
  const toggleMute = () => {
    if (peerService.localStream) {
      const audioTrack = peerService.localStream.getAudioTracks()[0];
      if (audioTrack) {
        // Toggle the track's enabled state
        audioTrack.enabled = !audioTrack.enabled;
        // Update the state based on the NEW track state
        const isNowMuted = !audioTrack.enabled;
        setIsMuted(isNowMuted);
        // Emit the NEW state change
        socketService.sendTrackStateChange(
          callInfo.roomId,
          "audio",
          !isNowMuted
        );
      }
    }
  };

  const toggleVideo = () => {
    if (peerService.localStream && callType === "video") {
      const videoTrack = peerService.localStream.getVideoTracks()[0];
      if (videoTrack) {
        // Toggle the track's enabled state
        videoTrack.enabled = !videoTrack.enabled;
        // Update the state based on the NEW track state
        const isNowVideoOff = !videoTrack.enabled;
        setIsVideoOff(isNowVideoOff);
        // Emit the NEW state change
        socketService.sendTrackStateChange(
          callInfo.roomId,
          "video",
          !isNowVideoOff
        );
      }
    }
  };

  // --- Updated Render Gallery ---
  const totalParticipants = 1 + remoteStreams.length;
  const localTile = (
    <VideoTile
      stream={peerService.localStream}
      isLocal={true}
      name={user.username}
      isLocalMuted={isMuted} // Pass local state
      isLocalVideoOff={isVideoOff} // Pass local state
      callType={callType}
    />
  );
  const remoteTiles = remoteStreams.map(({ peerId, stream }) => (
    <VideoTile
      key={peerId}
      stream={stream}
      isLocal={false}
      name={`User ${peerId.slice(-4)}`}
      // Pass signaled remote state
      isRemoteAudioEnabled={remoteTrackStates[peerId]?.audio ?? true} // Default to true
      isRemoteVideoEnabled={remoteTrackStates[peerId]?.video ?? true} // Default to true
      callType={callType}
    />
  ));

  // --- This is the new layout logic ---
  const renderGallery = () => {
    const allTiles = [localTile, ...remoteTiles];

    switch (totalParticipants) {
      case 1:
        return (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="w-full h-full max-w-4xl aspect-video">
              {localTile}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="w-full h-full flex flex-col md:flex-row gap-4 p-4">
            <div className="flex-1 min-h-0">{localTile}</div>
            <div className="flex-1 min-h-0">{remoteTiles[0]}</div>
          </div>
        );
      case 3:
        return (
          <div className="w-full h-full flex flex-col gap-4 p-4">
            {/* Top row with 2 */}
            <div className="flex-1 flex flex-row gap-4">
              <div className="flex-1 min-w-0">{allTiles[0]}</div>
              <div className="flex-1 min-w-0">{allTiles[1]}</div>
            </div>
            {/* Bottom row with 1 centered */}
            <div className="flex-1 flex justify-center items-center">
              <div className="w-full md:w-1/2 h-full">{allTiles[2]}</div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-4 p-4">
            {allTiles}
          </div>
        );
      default:
        // 5 or more, use a scrollable grid
        return (
          <div className="w-full h-full grid grid-cols-2 md:grid-cols-3 gap-4 p-4 overflow-y-auto">
            {allTiles}
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl p-4 flex flex-col gap-4 w-[90%] max-w-6xl h-[90vh] relative">
        <h2 className="text-white text-xl text-center">
          {callInfo.roomName} Group Call
        </h2>

        {/* --- 5. Video Gallery (Now uses renderGallery) --- */}
        <div className="flex-1 w-full h-full min-h-0 relative bg-gray-800 rounded-lg overflow-hidden">
          {renderGallery()}
        </div>

        {/* --- 6. Control Bar (No changes) --- */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center justify-center gap-4 p-3 bg-gray-800 bg-opacity-75 rounded-full shadow-lg z-20">
          <button
            onClick={toggleMute}
            className={`p-3 rounded-full text-white ${
              isMuted ? "bg-red-600" : "bg-gray-600"
            }`}
          >
            {isMuted ? (
              <MicOff className="w-6 h-6" />
            ) : (
              <Mic className="w-6 h-6" />
            )}
          </button>
          {callType === "video" && (
            <button
              onClick={toggleVideo}
              className={`p-3 rounded-full text-white ${
                isVideoOff ? "bg-red-600" : "bg-gray-600"
              }`}
            >
              {isVideoOff ? (
                <VideoOff className="w-6 h-6" />
              ) : (
                <Video className="w-6 h-6" />
              )}
            </button>
          )}
          <button
            onClick={onClose}
            className="p-3 bg-red-600 rounded-full text-white"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );

  //   return (
  //     <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
  //       <div className="bg-gray-900 rounded-xl p-4 flex flex-col gap-4 w-[90%] max-w-6xl h-[90vh] relative">
  //         <h2 className="text-white text-xl text-center">
  //           {callInfo.roomName} Group Call
  //         </h2>

  //         {/* --- 5. Video Gallery --- */}
  //         <div className="flex-1 w-full h-full min-h-0 relative bg-gray-800 rounded-lg overflow-hidden">
  //           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 h-full overflow-y-auto">
  //             {/* Local Video */}
  //             <VideoTile
  //               stream={peerService.localStream}
  //               isMuted={true} // Local video is always muted for us
  //               isLocal={true}
  //               name={user.username}
  //               isVideoOff={isVideoOff}
  //             />

  //             {/* Remote Videos */}
  //             {remoteStreams.map(({ peerId, stream }) => (
  //               <VideoTile
  //                 key={peerId}
  //                 stream={stream}
  //                 isMuted={false}
  //                 isLocal={false}
  //                 name={`User ${peerId.slice(-4)}`} // We'd need to map peerId to username
  //                 isVideoOff={!stream.getVideoTracks()[0]} // Check if video track exists
  //               />
  //             ))}
  //           </div>
  //         </div>

  //         {/* --- 6. Control Bar --- */}
  //         <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center justify-center gap-4 p-3 bg-gray-800 bg-opacity-75 rounded-full shadow-lg z-20">
  //           <button
  //             onClick={toggleMute}
  //             className={`p-3 rounded-full text-white ${
  //               isMuted ? "bg-red-600" : "bg-gray-600"
  //             }`}
  //           >
  //             {isMuted ? (
  //               <MicOff className="w-6 h-6" />
  //             ) : (
  //               <Mic className="w-6 h-6" />
  //             )}
  //           </button>
  //           {callType === "video" && (
  //             <button
  //               onClick={toggleVideo}
  //               className={`p-3 rounded-full text-white ${
  //                 isVideoOff ? "bg-red-600" : "bg-gray-600"
  //               }`}
  //             >
  //               {isVideoOff ? (
  //                 <VideoOff className="w-6 h-6" />
  //               ) : (
  //                 <Video className="w-6 h-6" />
  //               )}
  //             </button>
  //           )}
  //           <button
  //             onClick={onClose}
  //             className="p-3 bg-red-600 rounded-full text-white"
  //           >
  //             <PhoneOff className="w-6 h-6" />
  //           </button>
  //         </div>
  //       </div>
  //     </div>
  //   );
};

export default GroupCallModal;
