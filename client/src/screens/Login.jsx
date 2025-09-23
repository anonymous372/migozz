import { Link } from "react-router-dom";
import {
  ArrowRight,
  User,
  KeyRound,
  MessageCircle,
  Twitter,
  Github,
  Linkedin,
} from "lucide-react";

const Login = () => {
  return (
    <div className="flex flex-col md:flex-row items-center justify-center h-full p-8 py-8 pt-28">
      {/* Left side: Animated Migozz welcome */}
      <div className="flex flex-col items-center justify-center text-center md:text-left p-6 md:p-12">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter drop-shadow-md text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-blue-400 dark:to-purple-500 animate-fade-in">
          Welcome to Migozz
        </h1>
        <p className="mt-4 text-lg md:text-xl text-gray-700 dark:text-gray-300 max-w-lg animate-fade-in-up delay-100">
          Connect with your friends, create communities, and share your moments.
          It’s all here, waiting for you.
        </p>
        <div className="mt-8 flex gap-4 animate-fade-in-up delay-200">
          <a
            href="#"
            className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors duration-300 transform hover:scale-110"
          >
            <Twitter className="w-6 h-6" />
          </a>
          <a
            href="#"
            className="p-3 bg-gray-800 hover:bg-gray-900 text-white rounded-full transition-colors duration-300 transform hover:scale-110"
          >
            <Github className="w-6 h-6" />
          </a>
          <a
            href="#"
            className="p-3 bg-sky-600 hover:bg-sky-700 text-white rounded-full transition-colors duration-300 transform hover:scale-110"
          >
            <Linkedin className="w-6 h-6" />
          </a>
        </div>
      </div>

      {/* Right side: Login Form Card */}
      <div className="w-full max-w-sm bg-white dark:bg-gray-900 p-10 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 transition-colors duration-500">
        <div className="flex flex-col items-center mb-8">
          <MessageCircle className="w-20 h-20 text-blue-600 dark:text-blue-400 mb-4 animate-bounce-in" />
          <h2 className="text-4xl font-extrabold text-center tracking-tight">
            Login
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Welcome back! Please sign in.
          </p>
        </div>
        <form className="flex flex-col gap-6">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              type="email"
              placeholder="Username or Email"
              className="w-full p-4 pl-12 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 shadow-sm"
            />
          </div>
          <div className="relative">
            <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              type="password"
              placeholder="Password"
              className="w-full p-4 pl-12 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 shadow-sm"
            />
          </div>
          <button className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:scale-105">
            Login
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>
        <div className="mt-8 text-center text-sm">
          <p className="text-gray-600 dark:text-gray-400">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-bold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
