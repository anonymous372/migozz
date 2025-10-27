import {
  Paperclip,
  Download,
  FileText,
  Image as ImageIcon,
  Video,
  Eye,
} from "lucide-react";
import { useState } from "react";
import { FILE_BASE_URL } from "../constants";
import ImageModal from "./ImageModal";

const FileMessageDisplay = ({ message, isCurrentUser }) => {
  const [showImageModal, setShowImageModal] = useState(false);

  const getFileIcon = (mimeType) => {
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
    e.stopPropagation(); // Prevent triggering the container click
    try {
      // Fetch the file as a blob
      const response = await fetch(`${FILE_BASE_URL}${message.fileUrl}`);
      const blob = await response.blob();

      // Create a temporary URL for the blob
      const url = window.URL.createObjectURL(blob);

      // Create a temporary anchor element and trigger download
      const link = document.createElement("a");
      link.href = url;
      link.download = message.fileName; // This sets the download filename
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading file:", error);
      // Fallback to opening in new tab
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
    e.stopPropagation(); // Prevent triggering the container click

    try {
      // --- New "Save As" Logic ---
      // Check if the modern API is supported
      if (window.showSaveFilePicker) {
        // 1. Fetch the file data as a blob
        const response = await fetch(`${FILE_BASE_URL}${message.fileUrl}`);
        const blob = await response.blob();

        // 2. Open the "Save As" dialog
        const options = {
          suggestedName: message.fileName,
          // You can also suggest file types, but suggestedName is usually enough
        };

        const fileHandle = await window.showSaveFilePicker(options);

        // 3. Write the file to the location the user chose
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
      } else {
        // --- Fallback for older browsers (your original logic) ---
        console.warn(
          "showSaveFilePicker is not supported. Using fallback download."
        );
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
      // This error often happens if the user cancels the "Save As" dialog
      if (error.name === "AbortError") {
        console.log("User cancelled the save dialog.");
      } else {
        console.error("Error saving file:", error);
        // Fallback to opening in new tab
        window.open(`${FILE_BASE_URL}${message.fileUrl}`, "_blank");
      }
    }
  };

  const FileIcon = getFileIcon(message.fileMimeType);
  const fileCategory = getFileCategory(message.fileMimeType);
  const isImage = message.messageType === "image";
  const isVideo = fileCategory === "video";

  return (
    <div
      className={`flex flex-col gap-2 max-w-xs lg:max-w-md ${
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
      ) : (
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
