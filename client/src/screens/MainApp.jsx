import Sidebar from "../components/Sidebar";

const MainApp = () => {
  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold">Main App Area</h1>
        <p className="text-gray-600 dark:text-gray-400">
          This is where chat/servers/channels will go.
        </p>
      </div>
    </div>
  );
};

export default MainApp;
