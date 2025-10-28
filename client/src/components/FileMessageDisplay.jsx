import {
  Paperclip,
  Download,
  FileText,
  Image as ImageIcon,
  Video,
  Eye,
  Mic,
  Play, // Added
  Pause, // Added
} from "lucide-react";
import { useState, useRef, useEffect } from "react"; // Added useRef, useEffect
import { FILE_BASE_URL } from "../constants";
import ImageModal from "./ImageModal";

const FileMessageDisplay = ({ message, isCurrentUser }) => {
  const [showImageModal, setShowImageModal] = useState(false);

  // --- Audio Player State & Refs ---
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState("0:00");
  const [duration, setDuration] = useState("0:00");
  const [progress, setProgress] = useState(0);

  const getFileIcon = (mimeType, messageType) => {
    if (messageType === "audio") return Mic;
    if (mimeType?.startsWith("image/")) return ImageIcon;
    if (mimeType?.startsWith("video/")) return Video;
    if (mimeType?.includes("pdf")) return FileText;
    return Paperclip;
  };

  const getFileCategory = (mimeType) => {
    if (mimeType?.startsWith("image/")) return "image";
    if (mimeType?.startsWith("video/")) return "video";
    if (mimeType?.includes("pdf")) return "pdf";
    return "file";
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1024 / 1024).toFixed(1) + " MB";
  };

  const handleDownload = async (e) => {
    e.stopPropagation();
    try {
      const response = await fetch(`${FILE_BASE_URL}${message.fileUrl}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = message.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading file:", error);
      window.open(`${FILE_BASE_URL}${message.fileUrl}`, "_blank");
    }
  };

  const handleOpenInTab = () => {
    window.open(`${FILE_BASE_URL}${message.fileUrl}`, "_blank");
  };

  const handleImageClick = () => {
    setShowImageModal(true);
  };

  const handleSaveAs = async (e) => {
    e.stopPropagation();
    try {
      if (window.showSaveFilePicker) {
        const response = await fetch(`${FILE_BASE_URL}${message.fileUrl}`);
        const blob = await response.blob();
        const fileHandle = await window.showSaveFilePicker({
          suggestedName: message.fileName,
        });
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
      } else {
        const response = await fetch(`${FILE_BASE_URL}${message.fileUrl}`);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = message.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Error saving file:", error);
        window.open(`${FILE_BASE_URL}${message.fileUrl}`, "_blank");
      }
    }
  };

  // --- Helper to format time (e.g., 123 seconds -> "2:03") ---
  const formatAudioTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  // --- Audio Player Logic ---
  const togglePlayPause = (e) => {
    e.stopPropagation();
    // Guard clause: ensure audioRef is loaded
    if (!audioRef.current) {
      console.error("Audio element not loaded yet.");
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSliderChange = (e) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    const newTime = (audioRef.current.duration / 100) * e.target.value;
    audioRef.current.currentTime = newTime;
    setProgress(e.target.value);
  };

  // --- Audio Event Listeners ---
  const isAudio = message.messageType === "audio";

  useEffect(() => {
    const audio = audioRef.current; // Get the audio element

    // We only attach listeners if the element *exists*
    if (audio) {
      const onLoadedData = () => {
        setDuration(formatAudioTime(audio.duration));
        setCurrentTime(formatAudioTime(audio.currentTime));
      };
      const onTimeUpdate = () => {
        setCurrentTime(formatAudioTime(audio.currentTime));
        setProgress((audio.currentTime / audio.duration) * 100);
      };
      const onEnded = () => {
        setIsPlaying(false);
        setCurrentTime("0:00");
        setProgress(0);
        audio.currentTime = 0; // Reset time on end
      };

      // Attach listeners
      audio.addEventListener("loadedmetadata", onLoadedData);
      audio.addEventListener("timeupdate", onTimeUpdate);
      audio.addEventListener("ended", onEnded);

      // Check if data is already loaded (for fast connections)
      if (audio.readyState >= 1) {
        onLoadedData();
      }

      // Cleanup function
      return () => {
        audio.removeEventListener("loadedmetadata", onLoadedData);
        audio.removeEventListener("timeupdate", onTimeUpdate);
        audio.removeEventListener("ended", onEnded);
      };
    }
  }, [message.fileUrl, isAudio]); // Dependency array ensures this runs when the element is ready

  const FileIcon = getFileIcon(message.fileMimeType, message.messageType);
  const fileCategory = getFileCategory(message.fileMimeType);
  const isImage = message.messageType === "image";
  const isVideo = fileCategory === "video";
  // isAudio is defined above

  // --- Custom CSS for the slider ---
  const sliderStyle = {
    background: isCurrentUser
      ? `linear-gradient(to right, #93c5fd ${progress}%, #60a5fa ${progress}%)`
      : `linear-gradient(to right, #9ca3af ${progress}%, #6b7280 ${progress}%)`,
  };

  return (
    <div
      className={`flex mb-1 flex-col gap-2 max-w-xs lg:max-w-md ${
        isCurrentUser ? "items-end" : "items-start"
      }`}
    >
      {isImage || isVideo ? (
        <div className="rounded-lg overflow-hidden shadow-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
          {isImage ? (
            <img
              src={`${FILE_BASE_URL}${message.fileUrl}`}
              alt={message.fileName}
              className="max-h-64 w-auto cursor-pointer hover:opacity-90 transition-opacity"
              onClick={handleImageClick}
            />
          ) : (
            <video
              src={`${FILE_BASE_URL}${message.fileUrl}`}
              className="max-h-64 w-auto cursor-pointer hover:opacity-90 transition-opacity"
              onClick={handleImageClick}
              controls
            />
          )}
          {message.content && message.content !== message.fileName && (
            <div className="px-3 py-2 bg-gray-100 dark:bg-gray-800">
              <p className="text-sm text-gray-900 dark:text-white">
                {message.content}
              </p>
            </div>
          )}
        </div>
      ) : isAudio ? (
        // --- THIS IS THE NEW AUDIO PLAYER UI ---
        <div
          className={`flex items-center gap-2 p-2 rounded-lg w-full max-w-[280px] ${
            isCurrentUser
              ? "bg-blue-600 text-white"
              : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white"
          }`}
        >
          {/* Audio element is now *inside* the conditional block */}
          <audio
            ref={audioRef}
            src={`${FILE_BASE_URL}${message.fileUrl}`}
            preload="metadata"
            className="hidden" // Hide it visually
          />

          {/* Play/Pause Button */}
          <button
            onClick={togglePlayPause}
            className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
              isCurrentUser
                ? "bg-blue-500 hover:bg-blue-400"
                : "bg-gray-300 dark:bg-gray-500 hover:bg-gray-400 dark:hover:bg-gray-400"
            }`}
          >
            {isPlaying ? (
              <Pause
                className={`w-5 h-5 ${
                  isCurrentUser ? "text-white" : "text-gray-800 dark:text-white"
                }`}
                fill="currentColor"
              />
            ) : (
              <Play
                className={`w-5 h-5 ${
                  isCurrentUser ? "text-white" : "text-gray-800 dark:text-white"
                }`}
                fill="currentColor"
              />
            )}
          </button>
          {/* Slider & Time */}
          <div className="flex-1 flex flex-col justify-center gap-1">
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={handleSliderChange}
              style={sliderStyle}
              className={`w-full h-2 rounded-lg appearance-none cursor-pointer range-slider ${
                isCurrentUser ? "range-slider-blue" : "range-slider-gray"
              }`}
            />
            <span
              className={`text-xs self-end ${
                isCurrentUser
                  ? "text-blue-100"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              {duration !== "0:00"
                ? isPlaying
                  ? currentTime
                  : duration
                : "0:00"}
            </span>
          </div>
        </div>
      ) : (
        // --- This is your existing "file" block ---
        <div
          className="flex items-center gap-3 p-3 bg-gray-200 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200 hover:shadow-md w-full"
          onClick={handleOpenInTab}
          title="Click to open in new tab"
        >
          <FileIcon className="w-8 h-8 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
              {message.fileName}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatFileSize(message.fileSize)}
            </p>
          </div>
          <button
            onClick={handleSaveAs}
            className="p-1 hover:bg-gray-400 dark:hover:bg-gray-500 rounded transition-colors"
            title="Save file as..."
          >
            <Eye className="w-5 h-5 text-gray-600 dark:text-gray-400 flex-shrink-0 hover:scale-110 transition-transform" />
          </button>
        </div>
      )}

      {/* Image/Video Modal */}
      {showImageModal && (isImage || isVideo) && (
        <ImageModal
          imageUrl={`${FILE_BASE_URL}${message.fileUrl}`}
          fileName={message.fileName}
          onClose={() => setShowImageModal(false)}
          isVideo={isVideo}
        />
      )}
    </div>
  );
};

export default FileMessageDisplay;
