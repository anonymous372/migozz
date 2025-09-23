import { Link } from "react-router-dom";
import { Mail, Sun, Moon, Disc3 } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

const Navbar = () => {
  const { darkMode, setDarkMode } = useTheme();

  return (
    <nav className="flex items-center justify-between px-6 md:px-12 py-4 bg-white dark:bg-gray-900 shadow-md transition-colors duration-500">
      {/* Left: Logo and Name */}
      <Link
        to="/"
        className="flex items-center gap-2 text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight transform hover:scale-105 transition-transform duration-300"
      >
        <Disc3 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        Migozz
      </Link>

      {/* Right: Icons and Controls */}
      <div className="flex items-center gap-6">
        {/* Inbox Icon with Notification */}
        <button
          className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-300"
          aria-label="Inbox"
        >
          <Mail className="w-6 h-6 text-gray-700 dark:text-gray-200" />
          <span className="absolute top-1 right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full border-2 border-white dark:border-gray-900">
            3
          </span>
        </button>

        {/* Modern Theme Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="relative w-14 h-7 flex items-center rounded-full bg-gray-300 dark:bg-gray-700 transition-colors duration-300 focus:outline-none"
        >
          <span
            className={`absolute left-0.5 top-0.5 w-6 h-6 flex items-center justify-center rounded-full bg-white dark:bg-gray-900 shadow-md transform transition-transform duration-300 ${
              darkMode ? "translate-x-7" : "translate-x-0"
            }`}
          >
            {darkMode ? (
              <Moon className="w-4 h-4 text-gray-400" />
            ) : (
              <Sun className="w-4 h-4 text-yellow-500" />
            )}
          </span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
