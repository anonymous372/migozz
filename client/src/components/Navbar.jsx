import { Link } from "react-router-dom";
import { Mail, Sun, Moon, Disc3, Gamepad } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

const Navbar = () => {
  const { darkMode, toggleDarkMode } = useTheme();

  return (
    <nav className="flex h-14 items-center justify-between px-4 md:px-8 py-2 bg-white dark:bg-gray-900 navbar-bottom-shadow transition-colors duration-500">
      {/* Left: Logo and Name */}
      <Link
        to="/"
        className="flex items-center gap-2 text-xl font-extrabold text-gray-900 dark:text-white tracking-tight transform hover:scale-102 transition-transform duration-200"
      >
        <Disc3 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        <span className="hidden text-2xl md:inline">Migozz</span>
      </Link>

      {/* Right: Icons and Controls */}
      <div className="flex items-center gap-6">
        <Link
          to="/games"
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-300"
          aria-label="Games"
        >
          <Gamepad className="w-6 h-6 text-gray-700 dark:text-gray-200" />
        </Link>
        {/* Inbox Icon with Notification */}
        {/* <button
          className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-300"
          aria-label="Inbox"
        >
          <Mail className="w-6 h-6 text-gray-700 dark:text-gray-200" />
          <span className="absolute top-1 right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full border-2 border-white dark:border-gray-900">
            3
          </span>
        </button> */}

        {/* Modern Theme Toggle */}
        <button
          onClick={toggleDarkMode}
          className="relative w-14 h-7 flex items-center rounded-full bg-gray-300 dark:bg-gray-700 transition-colors duration-300 focus:outline-none"
          aria-label="Toggle theme"
        >
          <span
            className={`absolute left-[3px] w-6 h-6 flex items-center justify-center rounded-full bg-white dark:bg-gray-900 shadow-sm transform transition-transform duration-200 ${
              darkMode ? "translate-x-[27px]" : "translate-x-0"
            }`}
          >
            {darkMode ? (
              <Moon className="w-3 h-3 text-gray-400" />
            ) : (
              <Sun className="w-3 h-3 text-yellow-500" />
            )}
          </span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
