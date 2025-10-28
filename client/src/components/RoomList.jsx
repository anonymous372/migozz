import Tooltip from "./Tooltip";

const RoomList = ({ rooms, onRoomSelect, selectedRoom, collapsed }) => {
  if (!rooms || rooms.length === 0) {
    return (
      <div
        className={`p-4 text-center text-sm text-gray-500 dark:text-gray-400 ${
          collapsed ? "hidden" : ""
        }`}
      >
        No rooms joined.
      </div>
    );
  }

  return (
    <ul className="space-y-1 p-2">
      {rooms.map((room) => {
        const isSelected = selectedRoom?._id === room._id;

        return (
          <li key={room._id}>
            <button
              onClick={() => onRoomSelect(room)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                isSelected
                  ? "bg-blue-600 text-white"
                  : "hover:bg-gray-200 dark:hover:bg-gray-700"
              } ${collapsed ? "justify-center" : "justify-start"}`}
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
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <h4
                    className={`font-semibold truncate ${
                      isSelected ? "text-white" : "text-gray-900 dark:text-white"
                    }`}
                  >
                    {room.name}
                  </h4>
                </div>
              )}

              {/* Tooltip for collapsed mode */}
              {collapsed && (
                <Tooltip label={room.name} position="right">
                  <div className="w-10 h-10"></div> 
                </Tooltip>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
};

export default RoomList;