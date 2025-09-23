import { Link } from "react-router-dom";
import { Mail, Sun, Moon } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

const Navbar = () => {
  const { darkMode, setDarkMode } = useTheme();

  return (
    <nav className="flex items-center justify-between px-6 py-3 bg-white dark:bg-gray-900 shadow-md">
      {/* Left: Logo */}
      <Link
        to="/"
        className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight"
      >
        Migozz 🎧
      </Link>

      {/* Right: Icons */}
      <div className="flex items-center gap-4">
        {/* Inbox Icon */}
        <button
          className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          aria-label="Inbox"
        >
          <Mail className="w-6 h-6 text-gray-700 dark:text-gray-200" />
          <span className="absolute top-1 right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
            3
          </span>
        </button>

        {/* Modern Theme Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="relative w-12 h-6 flex items-center rounded-full bg-gray-300 dark:bg-gray-700 transition-colors duration-300"
        >
          <span
            className={`absolute left-0.5 top-0.5 w-5 h-5 flex items-center justify-center rounded-full bg-white dark:bg-gray-900 shadow transform transition-transform duration-300 ${
              darkMode ? "translate-x-6" : "translate-x-0"
            }`}
          >
            {darkMode ? (
              <Moon className="w-4 h-4 text-gray-200" />
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
