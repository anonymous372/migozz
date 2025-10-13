import { Link } from "react-router-dom";
import {
  Users,
  Video,
  MessageCircle,
  PlayCircle,
  Mic,
  Gamepad2,
  Group,
  AtSign,
  Globe,
  Lock,
} from "lucide-react";

const LandingPage = () => {
  const cards = [
    {
      icon: (
        <Users className="w-12 h-12 text-blue-600 dark:text-blue-400 mb-4" />
      ),
      title: "Connect with Friends",
      description:
        "Easily find and add friends with unique user tags to start conversations instantly.",
    },
    {
      icon: (
        <Mic className="w-12 h-12 text-green-600 dark:text-green-400 mb-4" />
      ),
      title: "Crystal-Clear Calls",
      description:
        "Enjoy seamless one-to-one audio and video calls with friends, no matter where they are.",
    },
    {
      icon: (
        <Gamepad2 className="w-12 h-12 text-purple-600 dark:text-purple-400 mb-4" />
      ),
      title: "Built-in Games",
      description:
        "Challenge your friends in multiplayer games or go solo. It's all built-in and ready to play.",
    },
    {
      icon: (
        <Group className="w-12 h-12 text-pink-600 dark:text-pink-400 mb-4" />
      ),
      title: "Organize Your Crew",
      description:
        "Create private group chats to keep your squad together and your conversations organized.",
    },
    {
      icon: (
        <MessageCircle className="w-12 h-12 text-red-600 dark:text-red-400 mb-4" />
      ),
      title: "Dynamic DMs",
      description:
        "Send and receive direct messages with rich media support for a more expressive chat experience.",
    },
    {
      icon: (
        <Lock className="w-12 h-12 text-yellow-600 dark:text-yellow-400 mb-4" />
      ),
      title: "Private & Secure",
      description:
        "Your conversations are protected with end-to-end encryption for maximum privacy.",
    },
  ];

  return (
    <div className="flex flex-col text-gray-900 dark:text-white transition-colors duration-500 relative">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-blue-200 via-white to-purple-200 dark:from-gray-950 dark:via-gray-800 dark:to-gray-900 animate-gradient-shift"></div>

      {/* Hero Section */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen-minus-navbar text-center px-4 py-16 md:py-24">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter drop-shadow-lg animate-fade-in-up text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-blue-400 dark:to-purple-500">
          Where Your Friends Are.
        </h1>
        <p className="mt-6 text-xl md:text-2xl text-gray-700 dark:text-gray-300 max-w-2xl animate-fade-in-up delay-100">
          Voice, video, and games. All the ways you hang out, all in one
          seamless app.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mt-10 animate-fade-in-up delay-200">
          <Link
            to="/app"
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
          >
            Get Started <Users className="w-5 h-5" />
          </Link>
          <Link
            to="/login"
            className="px-8 py-4 bg-white dark:bg-gray-800 text-gray-800 dark:text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-2 border border-gray-200 dark:border-gray-700"
          >
            Sign In <PlayCircle className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Feature Cards Section with Grid */}
      <div className="relative z-10 w-full px-4 py-16 md:py-24">
        <div className="container mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {cards.map((card, index) => (
            <div
              key={index}
              className="bg-white/5 dark:bg-gray-900/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
            >
              {card.icon}
              <h3 className="text-2xl font-bold mb-2">{card.title}</h3>
              <p className="text-gray-600 dark:text-gray-400">
                {card.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Section */}
      <footer className="relative z-10 w-full text-center py-8">
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          &copy; {new Date().getFullYear()} Migozz. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;
