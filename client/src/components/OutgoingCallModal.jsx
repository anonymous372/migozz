import { PhoneOff } from "lucide-react";

const OutgoingCallModal = ({ receiver, onCancel }) => {
  if (!receiver) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-8 text-white text-center shadow-xl">
        <h2 className="text-2xl font-semibold mb-4">Calling...</h2>
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-2xl font-bold">
            {/* Display receiver's initial */}
            {receiver.username.charAt(0).toUpperCase()}
          </div>
        </div>
        <p className="text-xl mb-8">Ringing {receiver.username}...</p>
        <div className="flex justify-center gap-6">
          <button
            onClick={onCancel}
            className="p-4 bg-red-600 rounded-full hover:bg-red-700 transition"
            title="Cancel Call"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default OutgoingCallModal;