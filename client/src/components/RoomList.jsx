import Tooltip from "./Tooltip";

const RoomList = ({ rooms, onRoomSelect, selectedRoom, collapsed }) => {
  // --- COLLAPSED VIEW ---
  if (collapsed) {
    return (
      <div className="flex flex-col h-full">
        {/* 1. Collapsed Rooms Header */}
        <h2 className="py-2 text-center text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-t border-gray-200 dark:border-gray-700">
          Rooms
        </h2>

        {/* Collapsed Rooms List */}
        <div className="flex-1 overflow-y-auto chat-scrollbar">
          <ul className="space-y-1 py-2 px-2">
            {rooms.map((room) => {
              const isSelected = selectedRoom?._id === room._id;
              let styles = "";
              // Added w-12 h-12 to the button itself
              if (isSelected && collapsed)
                styles =
                  "ring-blue-500 ring-2 rounded-full justify-center w-12 h-12";
              if (!isSelected && collapsed) styles = "justify-center w-12 h-12";

              return (
                <li key={room._id}>
                  <button
                    onClick={() => onRoomSelect(room)}
                    className={`flex items-center gap-3 text-left transition-colors outline-none ${styles}`}
                  >
                    {/* Avatar */}
                    <div
                      className={`flex-shrink-0 w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center ${
                        isSelected ? "bg-blue-400" : ""
                      }`}
                    >
                      <span
                        className={`text-sm font-medium ${
                          isSelected
                            ? "text-white"
                            : "text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {room.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    );
  }

  // --- EXPANDED VIEW ---
  return (
    <div className="flex flex-col h-full">
      {/* 2. Expanded Rooms Header */}
      <h2 className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-t border-gray-200 dark:border-gray-700">
        Rooms
      </h2>

      {/* Expanded Rooms List */}
      <div className="flex-1 overflow-y-auto chat-scrollbar">
        {/* 3. "No rooms" logic moved inside */}
        {!rooms || rooms.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
            No rooms joined.
          </div>
        ) : (
          <ul className="space-y-1 py-2 px-4">
            {rooms.map((room) => {
              const isSelected = selectedRoom?._id === room._id;
              let styles = "";
              if (isSelected && !collapsed)
                styles =
                  "rounded-lg bg-blue-100 dark:bg-blue-900 justify-start p-3";
              if (!isSelected && !collapsed)
                styles =
                  "rounded-lg justify-start p-3 hover:bg-gray-100 dark:hover:bg-gray-700";

              return (
                <li key={room._id}>
                  <button
                    onClick={() => onRoomSelect(room)}
                    className={`w-full flex items-center gap-3 text-left transition-colors outline-none ${styles}`}
                  >
                    {/* Avatar */}
                    <div
                      className={`flex-shrink-0 w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center ${
                        isSelected ? "bg-blue-400" : ""
                      }`}
                    >
                      <span
                        className={`text-sm font-medium ${
                          isSelected
                            ? "text-white"
                            : "text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {room.name.charAt(0).toUpperCase()}
                      </span>
                    </div>

                    {/* Room Name (hidden when collapsed) */}
                    <div className="flex-1 min-w-0">
                      <h4
                        className={`font-semibold truncate ${
                          isSelected
                            ? "text-blue-800 dark:text-white"
                            : "text-gray-700 dark:text-white"
                        }`}
                      >
                        {room.name}
                      </h4>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default RoomList;
