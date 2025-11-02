import { useEffect, useRef, useState } from "react";
import peerService from "../services/peerService";
import socketService from "../services/socket";
import { Mic, MicOff, Video, VideoOff, PhoneOff, User } from "lucide-react";

// --- 1. THIS COMPONENT IS NOW FIXED ---
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
  }, [stream]);

  // Determine final states
  const audioIsEnabled = isLocal ? !isLocalMuted : isRemoteAudioEnabled;
  const videoIsEnabled = isLocal ? !isLocalVideoOff : isRemoteVideoEnabled;

  // Determine if we should *show* the video feed
  const showVideo = callType === "video" && videoIsEnabled;

  return (
    <div className="bg-gray-700 rounded-lg overflow-hidden aspect-video relative flex items-center justify-center">
      {/* --- THIS IS THE FIX --- */}
      {/* The <video> tag is now rendered ALWAYS.
        It is necessary to play the audio from the stream.
        We just hide it if it's an audio call or video is off.
      */}
      <video
        ref={videoRef}
        autoPlay
        muted={isLocal} // Only mute local stream for ourselves
        className={`w-full h-full object-cover ${
          showVideo ? "opacity-100" : "opacity-0" // Hide, but keep in DOM
        }`}
      />

      {/* Show the avatar if video is OFF */}
      {!showVideo && (
        <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
          <User className="w-16 h-16 text-gray-500" />
        </div>
      )}
      {/* --- END FIX --- */}

      {/* --- Overlays (Name & Mute Icon) --- */}
      <span className="absolute bottom-2 left-2 text-white bg-black bg-opacity-50 px-2 py-1 rounded text-sm z-10">
        {name} {isLocal ? "(You)" : ""}
      </span>

      {/* Show icon if audio is off */}
      {!audioIsEnabled && (
        <MicOff className="absolute top-2 right-2 text-white bg-black bg-opacity-25 rounded-full p-1 z-10" />
      )}
    </div>
  );
};
// --- END OF VideoTile FIX ---

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
        console.log("Member left, removing stream:", data.peerId); // <-- FIX
        peerService.closeConnection(data.peerId); // <-- FIX
        setRemoteStreams(
          (prev) => prev.filter((s) => s.peerId !== data.peerId) // <-- FIX
        );
        // Remove their track state
        setRemoteTrackStates((prev) => {
          const newState = { ...prev };
          delete newState[data.peerId]; // <-- FIX
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

  useEffect(() => {
    // If the call was once active (had >1 person)
    // AND now the members list has shrunk to 1 (only us)
    if (
      hasCallBeenActive &&
      members.length === 1 &&
      members[0].peerId === user._id
    ) {
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

  // --- 3. FIX FOR USERNAMES ---
  const remoteTiles = remoteStreams.map(({ peerId, stream }) => {
    // Find the member from the 'members' prop
    const member = members.find((m) => m.peerId === peerId);
    const name = member ? member.username : `User ${peerId.slice(-4)}`; // Use username

    return (
      <VideoTile
        key={peerId}
        stream={stream}
        isLocal={false}
        name={name} // <-- Pass the correct name
        isRemoteAudioEnabled={remoteTrackStates[peerId]?.audio ?? true}
        isRemoteVideoEnabled={remoteTrackStates[peerId]?.video ?? true}
        callType={callType}
      />
    );
  });
  // --- END FIX ---

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
            <div className="flex-1 min-h-0">{allTiles[0]}</div>
            <div className="flex-1 min-h-0">{allTiles[1]}</div>
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
};

export default GroupCallModal;
