import { Phone, PhoneOff } from "lucide-react";

const IncomingAudioCallModal = ({ caller, onAccept, onReject }) => {
  if (!caller) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-8 text-white text-center shadow-xl">
        <h2 className="text-2xl font-semibold mb-4">Incoming Audio Call</h2>
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-2xl font-bold">
            {caller.username.charAt(0).toUpperCase()}
          </div>
        </div>
        <p className="text-xl mb-8">{caller.username} is calling...</p>
        <div className="flex justify-center gap-6">
          <button
            onClick={onReject}
            className="p-4 bg-red-600 rounded-full hover:bg-red-700 transition"
            title="Reject"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
          <button
            onClick={onAccept}
            className="p-4 bg-green-600 rounded-full hover:bg-green-700 transition"
            title="Accept"
          >
            <Phone className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingAudioCallModal;