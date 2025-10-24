import { useEffect, useState } from "react";

const Square = ({ value, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`w-20 h-20 md:w-24 md:h-24 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-2xl font-bold ${
      disabled ? "opacity-80 cursor-not-allowed" : "hover:scale-105"
    }`}
  >
    {value}
  </button>
);

const TicTacToe = () => {
  const [squares, setSquares] = useState(Array(9).fill(null));
  // true => X's turn (user), false => O's turn (computer)
  const [xIsNext, setXIsNext] = useState(() => Math.random() < 0.5);
  const [thinking, setThinking] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [isDark, setIsDark] = useState(false);

  const winner = calculateWinner(squares);

  const reset = (randomStart = true) => {
    setSquares(Array(9).fill(null));
    setXIsNext(randomStart ? Math.random() < 0.5 : true);
    setThinking(false);
    setInitialized(true);
  };

  // Minimax AI for the computer (O). Returns index of best move.
  const bestMoveForO = (board) => {
    const avail = board.map((v, i) => (v ? null : i)).filter((v) => v !== null);

    const scores = { O: 1, X: -1, tie: 0 };

    function minimax(b, isMax) {
      const w = calculateWinner(b);
      if (w) return scores[w];
      if (b.every((v) => v)) return 0; // tie

      if (isMax) {
        // O to move
        let best = -Infinity;
        for (let i = 0; i < 9; i++) {
          if (!b[i]) {
            b[i] = "O";
            const score = minimax(b, false);
            b[i] = null;
            best = Math.max(best, score);
          }
        }
        return best;
      } else {
        // X to move
        let best = Infinity;
        for (let i = 0; i < 9; i++) {
          if (!b[i]) {
            b[i] = "X";
            const score = minimax(b, true);
            b[i] = null;
            best = Math.min(best, score);
          }
        }
        return best;
      }
    }

    // Small chance to play sub-optimally to make the AI beatable.
    const RANDOMNESS = 0.4; // ~40% chance to pick a random available move
    if (Math.random() < RANDOMNESS && avail.length > 0) {
      return avail[Math.floor(Math.random() * avail.length)];
    }

    let move = null;
    let bestScore = -Infinity;
    for (const i of avail) {
      const b = board.slice();
      b[i] = "O";
      const score = minimax(b, false);
      if (score > bestScore) {
        bestScore = score;
        move = i;
      }
    }
    return move;
  };

  // detect dark mode (prefers-color-scheme or .dark class)
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    const handle = (e) =>
      setIsDark(
        (e && e.matches) || document.documentElement.classList.contains("dark")
      );
    setIsDark(
      document.documentElement.classList.contains("dark") ||
        (mq ? mq.matches : false)
    );
    if (mq && mq.addEventListener) mq.addEventListener("change", handle);
    else if (mq && mq.addListener) mq.addListener(handle);
    return () => {
      if (mq && mq.removeEventListener)
        mq.removeEventListener("change", handle);
      else if (mq && mq.removeListener) mq.removeListener(handle);
    };
  }, []);

  const isDraw = !winner && squares.every((v) => v);

  // when it's computer's turn, pick best move (wait until initialized and not finished)
  useEffect(() => {
    if (!initialized) return;
    if (winner || isDraw) return; // game over or draw
    if (xIsNext === false) {
      setThinking(true);
      // longer thinking for nicer UX
      const timeout = setTimeout(() => {
        const idx = bestMoveForO(squares);
        if (idx != null) {
          setSquares((prev) => {
            const next = prev.slice();
            next[idx] = "O";
            return next;
          });
        }
        setXIsNext(true);
        setThinking(false);
      }, 900 + Math.random() * 800); // ~0.9s - 1.7s
      return () => clearTimeout(timeout);
    }
  }, [xIsNext, squares, winner, initialized, isDraw]);

  const handleClick = (i) => {
    // user is X
    if (!initialized) return;
    if (!xIsNext) return; // not user's turn
    if (thinking) return;
    const sq = squares.slice();
    if (sq[i] || calculateWinner(sq)) return;
    sq[i] = "X";
    setSquares(sq);
    setXIsNext(false);
  };

  // ensure initialized on first mount so users can play immediately
  useEffect(() => {
    if (!initialized) setInitialized(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusText = !initialized
    ? xIsNext
      ? "You will play first"
      : "Computer will play first"
    : winner || isDraw
    ? ""
    : thinking
    ? "Computer thinking..."
    : xIsNext
    ? "Your turn (X)"
    : "Computer's turn (O)";
  return (
    <div className="p-6 h-full min-h-[calc(100vh-56px)]">
      <div className="max-w-md mx-auto flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-2 text-center">Tic Tac Toe</h1>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-300 text-center">
          You are X. Try to beat the computer.
        </p>

        <div className="my-4 flex justify-center w-full">
          <div className="inline-block relative" style={{ padding: 6 }}>
            {/* outer border */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                boxSizing: "border-box",
                // border: `6px solid ${isDark ? "#9ca3af" : "#222"}`,
              }}
            />
            {/* outer border with updated styles */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                boxSizing: "border-box",
                // border: `6px solid ${isDark ? "#e5e7eb" : "#111"}`,
                borderRadius: 18,
              }}
            />

            {/* grid cells without borders */}
            <div
              style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)" }}
            >
              {squares.map((s, i) => {
                const style = {
                  width: 88,
                  height: 88,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 32,
                  fontWeight: 800,
                };
                return (
                  <button
                    key={i}
                    onClick={() => handleClick(i)}
                    disabled={
                      !!s ||
                      !xIsNext ||
                      !!winner ||
                      !initialized ||
                      thinking ||
                      isDraw
                    }
                    style={style}
                    className={`focus:outline-none text-black dark:text-white ${
                      !!s ? "" : "hover:bg-green-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>

            {/* hash-style overlay lines (2 vertical, 2 horizontal) */}
            <div
              className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none"
              aria-hidden
            >
              {/* thick vertical lines */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  left: "33.333%",
                  width: 8,
                  background: isDark ? "#e5e7eb" : "#111",
                  transform: "translateX(-50%)",
                  borderRadius: 9999,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  left: "66.666%",
                  width: 8,
                  background: isDark ? "#e5e7eb" : "#111",
                  transform: "translateX(-50%)",
                  borderRadius: 9999,
                }}
              />

              {/* thick horizontal lines */}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: "33.333%",
                  height: 8,
                  background: isDark ? "#e5e7eb" : "#111",
                  transform: "translateY(-50%)",
                  borderRadius: 9999,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: "66.666%",
                  height: 8,
                  background: isDark ? "#e5e7eb" : "#111",
                  transform: "translateY(-50%)",
                  borderRadius: 9999,
                }}
              />
            </div>
          </div>
        </div>

        <div className="mt-4 text-center">
          <div className="text-sm font-medium mb-3">{statusText}</div>
          <div className="flex justify-center">
            <button
              onClick={() => reset(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-md"
            >
              Reset
            </button>
          </div>
        </div>
        {(winner || isDraw) && (
          <div className="w-full flex justify-center">
            <div
              className={`mt-4 w-11/12 md:w-3/4 p-4 rounded-lg text-center text-lg font-semibold`}
              style={{
                background: isDraw
                  ? isDark
                    ? "rgba(75,85,99,0.18)"
                    : "rgba(243,244,246,0.8)"
                  : winner === "X"
                  ? isDark
                    ? "rgba(4,120,87,0.18)"
                    : "rgba(220,252,231,0.85)"
                  : isDark
                  ? "rgba(153,27,27,0.18)"
                  : "rgba(254,226,226,0.85)",
                color: isDraw
                  ? isDark
                    ? "#e5e7eb"
                    : "#1f2937"
                  : winner === "X"
                  ? isDark
                    ? "#bbf7d0"
                    : "#065f46"
                  : isDark
                  ? "#fecaca"
                  : "#7f1d1d",
              }}
            >
              {isDraw
                ? "It's a draw."
                : winner === "X"
                ? "You won!"
                : "You lost."}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

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

export default TicTacToe;
