import { X, Download } from "lucide-react"; // 1. Import the Download icon

const ImageModal = ({ imageUrl, fileName, onClose, isVideo = false }) => {
  // 2. Add the download handler (same as the 'handleSaveAs' logic)
  const handleDownload = async (e) => {
    e.stopPropagation(); // Stop click from closing the modal

    try {
      // Try to use the modern "Save As" dialog
      if (window.showSaveFilePicker) {
        const response = await fetch(imageUrl);
        const blob = await response.blob();

        const fileHandle = await window.showSaveFilePicker({
          suggestedName: fileName,
        });

        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
      } else {
        // Fallback for older browsers (force download)
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName; // Use the original filename
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      // Ignore error if user cancels the "Save As" dialog
      if (error.name !== "AbortError") {
        console.error("Error saving file:", error);
        alert("Failed to download file.");
      }
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      {/* 3. Group the buttons together */}
      <div className="absolute top-4 right-4 flex gap-3 z-10">
        {/* Download Button */}
        <button
          onClick={handleDownload}
          className="p-2 bg-gray-800 hover:bg-gray-700 rounded-full transition-colors"
          title="Download"
        >
          <Download className="w-6 h-6 text-white" />
        </button>

        {/* Close button */}
        <button
          onClick={onClose}
          className="p-2 bg-gray-800 hover:bg-gray-700 rounded-full transition-colors"
        >
          <X className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Image/Video */}
      <div className="max-w-[90vw] max-h-[90vh] flex items-center justify-center">
        {isVideo ? (
          <video
            src={imageUrl}
            controls
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <img
            src={imageUrl}
            alt={fileName}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        )}
      </div>
    </div>
  );
};

export default ImageModal;
