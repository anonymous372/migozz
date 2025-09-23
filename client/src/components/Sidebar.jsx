const Sidebar = () => {
  return (
    <aside className="w-64 h-screen bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white p-4 flex flex-col">
      <h2 className="text-xl font-bold mb-6">Sidebar</h2>
      <div className="flex flex-col gap-3">
        <div className="px-3 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-700 cursor-pointer">
          Item 1
        </div>
        <div className="px-3 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-700 cursor-pointer">
          Item 2
        </div>
        <div className="px-3 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-700 cursor-pointer">
          Item 3
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
