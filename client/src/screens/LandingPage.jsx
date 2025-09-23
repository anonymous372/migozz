import { Link } from "react-router-dom";

const LandingPage = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
      <h1 className="text-4xl font-bold mb-6">Welcome to Migozz 🎧</h1>
      <p className="mb-8 text-lg text-gray-600 dark:text-gray-300">
        A modern social platform inspired by Discord
      </p>
      <div className="flex gap-4">
        <Link
          to="/login"
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
        >
          Login
        </Link>
        <Link
          to="/register"
          className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
        >
          Register
        </Link>
        <Link
          to="/app"
          className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
        >
          Enter App
        </Link>
      </div>
    </div>
  );
};

export default LandingPage;
