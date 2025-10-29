import { useEffect, useState, useMemo } from "react";
import socketService from "../../services/socket"; // Import your socket service
import { useAuth } from "../../context/AuthContext"; // Import useAuth
import { Clipboard, Check } from "lucide-react";

// (Your calculateWinner function remains unchanged)
function calculateWinner(squares) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }
  return null;
}

const TicTacToeMultiplayer = () => {
  const { user } = useAuth(); // Get current user

  // Game State Management
  const [gameState, setGameState] = useState("lobby"); // 'lobby', 'waiting', 'playing', 'gameover'
  const [roomCode, setRoomCode] = useState("");
  const [playerSymbol, setPlayerSymbol] = useState(null); // 'X' or 'O'
  const [opponent, setOpponent] = useState(null);
  const [rematchState, setRematchState] = useState("none");

  // Board State
  const [squares, setSquares] = useState(Array(9).fill(null));
  const [turn, setTurn] = useState("X"); // 'X' always starts

  // UI State
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [gameMessage, setGameMessage] = useState("");

  const winner = useMemo(() => calculateWinner(squares), [squares]);
  const isDraw = useMemo(
    () => !winner && squares.every((v) => v),
    [squares, winner]
  );
  const isMyTurn = useMemo(
    () => gameState === "playing" && turn === playerSymbol,
    [gameState, turn, playerSymbol]
  );

  // --- Socket Event Listeners ---
  useEffect(() => {
    // Listen for game creation
    socketService.onTicTacToeGameCreated(({ roomCode, playerSymbol }) => {
      setRoomCode(roomCode);
      setPlayerSymbol(playerSymbol);
      setGameState("waiting");
      setGameMessage("Waiting for an opponent...");
    });

    // Listen for game start (when P2 joins)
    socketService.onTicTacToeGameStart(
      ({ roomCode, players, squares, turn }) => {
        setRoomCode(roomCode);
        setSquares(squares);
        setTurn(turn);

        const me = players.find((p) => p.user._id === user._id);
        const opp = players.find((p) => p.user._id !== user._id);

        setPlayerSymbol(me.symbol);
        setOpponent(opp.user);
        setGameState("playing");
      }
    );

    // Listen for state updates (after a move)
    socketService.onTicTacToeUpdateState(({ squares, turn }) => {
      setSquares(squares);
      setTurn(turn);
    });

    // Listen for errors
    socketService.onTicTacToeError((message) => {
      alert(`Error: ${message}`);
      // If we were trying to join, reset to lobby
      if (gameState === "lobby") {
        setJoinCodeInput("");
      }
    });

    // Listen for opponent leaving
    socketService.onTicTacToeOpponentLeft(() => {
      setGameMessage("Your opponent left the game.");
      setGameState("gameover");
      setRematchState("none");
    });

    // Listen for a rematch request from opponent
    socketService.onTicTacToeRematchRequested(() => {
      setRematchState("received");
    });

    socketService.onTicTacToeGameReset(({ squares, turn }) => {
      setSquares(squares);
      setTurn(turn);
      setGameState("playing");
      setRematchState("none");
      setGameMessage("");
    });

    // Cleanup listeners on unmount
    return () => {
      socketService.removeAllTicTacToeListeners();
      // Optional: If user leaves page, emit a 'leave_game' event
    };
  }, [user._id, gameState]); // Re-run if user context changes

  // --- Game Actions ---

  const handleCreateGame = () => {
    socketService.createTicTacToeGame();
  };

  const handleJoinGame = (e) => {
    e.preventDefault();
    if (joinCodeInput.trim()) {
      socketService.joinTicTacToeGame(joinCodeInput.trim().toUpperCase());
    }
  };

  const handleClick = (i) => {
    if (!isMyTurn || squares[i] || winner || isDraw) {
      return; // Not your turn, square taken, or game over
    }

    // Emit the move to the server
    socketService.makeTicTacToeMove(roomCode, i);
  };

  const resetGame = () => {
    // This would need more logic (e.g., "rematch" request)
    // For now, just reset to lobby
    setGameState("lobby");
    setRoomCode("");
    setPlayerSymbol(null);
    setOpponent(null);
    setSquares(Array(9).fill(null));
    setTurn("X");
    setGameMessage("");
    setJoinCodeInput("");
    setRematchState("none"); // Reset rematch state
  };

  const handleRequestRematch = () => {
    socketService.requestTicTacToeRematch(roomCode);
    setRematchState("requested");
  };

  const handleAcceptRematch = () => {
    socketService.acceptTicTacToeRematch(roomCode);
    // No need to set state, onTicTacToeGameReset will handle it
  };

  // --- UI Helpers ---

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // --- Status Text ---
  let statusText;
  if (gameState === "playing") {
    if (winner) {
      statusText = winner === playerSymbol ? "You Won!" : "You Lost.";
    } else if (isDraw) {
      statusText = "It's a Draw!";
    } else {
      statusText = isMyTurn
        ? "Your turn"
        : `Opponent's turn (${opponent?.username})`;
    }
  } else if (gameState === "waiting") {
    statusText = "Waiting for opponent...";
  } else if (gameState === "gameover") {
    statusText = gameMessage || "Game Over";
  } else {
    statusText = "Create or join a game to play.";
  }

  // --- Render Logic ---

  if (gameState === "lobby") {
    return (
      <div className="p-6 h-full min-h-[calc(100vh-56px)] flex items-center justify-center">
        <div className="max-w-md mx-auto flex flex-col items-center">
          <h1 className="text-2xl font-bold mb-6">Tic Tac Toe (Multiplayer)</h1>
          <button
            onClick={handleCreateGame}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-md mb-4 font-semibold text-lg"
          >
            Create New Game
          </button>
          <div className="text-center text-gray-500 my-2">OR</div>
          <form onSubmit={handleJoinGame} className="w-full flex flex-col">
            <input
              type="text"
              value={joinCodeInput}
              onChange={(e) => setJoinCodeInput(e.target.value)}
              placeholder="Enter game code"
              maxLength={6}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-center uppercase tracking-widest font-mono"
            />
            <button
              type="submit"
              className="w-full px-6 py-3 bg-green-600 text-white rounded-md mt-2 font-semibold text-lg"
            >
              Join Game
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (gameState === "waiting") {
    return (
      <div className="p-6 h-full min-h-[calc(100vh-56px)] flex items-center justify-center">
        <div className="max-w-md mx-auto flex flex-col items-center text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <h2 className="text-xl font-semibold mt-4">{statusText}</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Share this code with your friend:
          </p>
          <div className="flex items-center gap-2 mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-md border border-gray-300 dark:border-gray-700">
            <span className="text-2xl font-mono tracking-widest">
              {roomCode}
            </span>
            <button
              onClick={handleCopyCode}
              className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              {copied ? (
                <Check className="w-5 h-5 text-green-500" />
              ) : (
                <Clipboard className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Main Game View ('playing' or 'gameover') ---
  return (
    <div className="p-6 h-full min-h-[calc(100vh-56px)]">
      <div className="max-w-md mx-auto flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-2 text-center">Tic Tac Toe</h1>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-300 text-center">
          You are <span className="font-bold">{playerSymbol}</span>. Playing
          against <span className="font-bold">{opponent?.username}</span>.
        </p>

        {/* (Your existing game board styling) */}
        <div className="grid grid-cols-3 gap-2 my-4">
          {squares.map((value, i) => (
            <button
              key={i}
              onClick={() => handleClick(i)}
              disabled={!!value || !isMyTurn || !!winner || isDraw}
              className={`w-20 h-20 md:w-24 md:h-24 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-4xl font-bold
                ${
                  isMyTurn && !value && !winner
                    ? "hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                    : "cursor-not-allowed"
                }
                ${value === "X" ? "text-blue-500" : "text-red-500"}
              `}
            >
              {value}
            </button>
          ))}
        </div>

        <div className="mt-4 text-center">
          <div
            className={`text-lg font-medium mb-3 ${
              winner || isDraw ? "text-green-600 dark:text-green-400" : ""
            }`}
          >
            {statusText}
          </div>
          {(winner || isDraw || gameState === "gameover") && (
            <div className="flex gap-4 justify-center">
              <button
                onClick={resetGame}
                className="px-6 py-2 bg-blue-600 text-white rounded-md"
              >
                Back to Lobby
              </button>
              {/* Rematch Button Logic */}
              {rematchState === "none" && (
                <button
                  onClick={handleRequestRematch}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md"
                >
                  Reset Game
                </button>
              )}
              {rematchState === "requested" && (
                <button
                  disabled
                  className="px-6 py-2 bg-blue-400 text-white rounded-md opacity-70"
                >
                  Request Sent
                </button>
              )}
              {rematchState === "received" && (
                <button
                  onClick={handleAcceptRematch}
                  className="px-6 py-2 bg-green-600 text-white rounded-md"
                >
                  Accept Rematch
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicTacToeMultiplayer;
