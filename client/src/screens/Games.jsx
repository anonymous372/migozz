import { Link } from "react-router-dom";
import { Gamepad } from "lucide-react";

const GameCard = ({ title, description, to }) => (
  <Link
    to={to}
    className="block bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 p-6 w-full max-w-md mx-auto"
  >
    <div className="flex items-center gap-4">
      <Gamepad className="w-10 h-10 text-blue-600 dark:text-blue-400" />
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
          {description}
        </p>
      </div>
    </div>
  </Link>
);

const Games = () => {
  return (
    <div className="p-6 h-full min-h-[calc(100vh-56px)]">
      <h1 className="text-2xl font-bold mb-4">Games</h1>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
        Quick showcase of small games you can play inside Migozz.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GameCard
          title="Tic Tac Toe"
          description="Classic 3x3 Tic Tac Toe against a friend or AI (coming soon)."
          to="/games/tictactoe"
        />

        <GameCard
          title="Sudoku"
          description="Daily Sudoku puzzles to exercise your brain."
          to="/games/sudoku"
        />
      </div>
    </div>
  );
};

export default Games;
