import { Plus } from "lucide-react";

const Sidebar = () => {
  return (
    <aside className="w-20 lg:w-64 h-screen bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white p-4 flex flex-col transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <h2 className="hidden lg:block text-xl font-bold">Servers</h2>
        <button className="flex items-center justify-center w-12 h-12 rounded-full lg:w-10 lg:h-10 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors duration-300">
          <Plus className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 flex flex-col gap-3 overflow-y-auto no-scrollbar">
        {/* Placeholder for server/DM icons */}
        <div className="w-12 h-12 lg:w-auto lg:h-auto lg:px-3 lg:py-2 rounded-full lg:rounded-md hover:bg-gray-300 dark:hover:bg-gray-700 cursor-pointer flex items-center justify-center lg:justify-start transition-colors duration-300">
          <span className="font-bold hidden lg:block">DM's</span>
          <span className="lg:hidden text-lg font-bold">DM</span>
        </div>
        <div className="w-12 h-12 lg:w-auto lg:h-auto lg:px-3 lg:py-2 rounded-full lg:rounded-md bg-blue-500 hover:bg-blue-600 cursor-pointer flex items-center justify-center lg:justify-start transition-colors duration-300 text-white">
          <span className="font-bold hidden lg:block">Server 1</span>
          <span className="lg:hidden text-lg font-bold">S1</span>
        </div>
        <div className="w-12 h-12 lg:w-auto lg:h-auto lg:px-3 lg:py-2 rounded-full lg:rounded-md hover:bg-gray-300 dark:hover:bg-gray-700 cursor-pointer flex items-center justify-center lg:justify-start transition-colors duration-300">
          <span className="font-bold hidden lg:block">Server 2</span>
          <span className="lg:hidden text-lg font-bold">S2</span>
        </div>
        <div className="w-12 h-12 lg:w-auto lg:h-auto lg:px-3 lg:py-2 rounded-full lg:rounded-md hover:bg-gray-300 dark:hover:bg-gray-700 cursor-pointer flex items-center justify-center lg:justify-start transition-colors duration-300">
          <span className="font-bold hidden lg:block">Server 3</span>
          <span className="lg:hidden text-lg font-bold">S3</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
