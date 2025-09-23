import Sidebar from "../components/Sidebar";
import { Search, Mic, Video, Send, Settings, UserPlus } from "lucide-react";

const MainApp = () => {
  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-500">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-800 shadow-md transition-colors duration-500">
          <h2 className="text-xl font-bold">General Chat</h2>
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search..."
                className="w-48 p-2 pl-10 rounded-md border dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              aria-label="Audio Call"
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-300"
            >
              <Mic className="w-6 h-6 text-gray-700 dark:text-gray-200" />
            </button>
            <button
              aria-label="Video Call"
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-300"
            >
              <Video className="w-6 h-6 text-gray-700 dark:text-gray-200" />
            </button>
            <button
              aria-label="Settings"
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-300"
            >
              <Settings className="w-6 h-6 text-gray-700 dark:text-gray-200" />
            </button>
          </div>
        </header>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
          {/* Placeholder for messages */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
              TM
            </div>
            <div className="flex flex-col">
              <span className="font-bold">Teo</span>
              <p className="p-3 bg-gray-200 dark:bg-gray-700 rounded-lg max-w-lg">
                Hey everyone, what's up?
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-bold">
              JC
            </div>
            <div className="flex flex-col">
              <span className="font-bold">John</span>
              <p className="p-3 bg-gray-200 dark:bg-gray-700 rounded-lg max-w-lg">
                Chilling. Anyone up for a game?
              </p>
            </div>
          </div>
        </div>

        {/* Message Input */}
        <div className="p-4 bg-white dark:bg-gray-800 transition-colors duration-500 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="Message #general..."
              className="flex-1 p-3 rounded-md border dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              aria-label="Send Message"
              className="p-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-300"
            >
              <Send className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <aside className="w-64 h-screen bg-white dark:bg-gray-800 p-4 flex flex-col border-l border-gray-200 dark:border-gray-700 hidden lg:flex transition-colors duration-500">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Friends</h2>
          <button
            aria-label="Add Friend"
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-300"
          >
            <UserPlus className="w-6 h-6" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {/* Online Friends List */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-emerald-500"></div>
              <span className="font-bold">Alex</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Online
              </span>
            </div>
            <div className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-yellow-500"></div>
              <span className="font-bold">Sarah</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Idle
              </span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default MainApp;
