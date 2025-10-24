import React, { useEffect, useState } from "react";
import { Play, Pause } from "lucide-react";

const cloneGrid = (g) => g.map((r) => r.slice());
const CELLS_TO_SOLVE = 37;
const shuffle = (arr) => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const isValidPlacement = (grid, row, col, val) => {
  if (!val) return true;
  for (let i = 0; i < 9; i++) {
    if (grid[row][i] === val && i !== col) return false;
    if (grid[i][col] === val && i !== row) return false;
  }
  const br = Math.floor(row / 3) * 3;
  const bc = Math.floor(col / 3) * 3;
  for (let r = br; r < br + 3; r++) {
    for (let c = bc; c < bc + 3; c++) {
      if ((r !== row || c !== col) && grid[r][c] === val) return false;
    }
  }
  return true;
};

function generateFullGrid() {
  const grid = Array.from({ length: 9 }, () => Array(9).fill(null));
  const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  function backtrack(pos = 0) {
    if (pos >= 81) return true;
    const r = Math.floor(pos / 9);
    const c = pos % 9;
    const order = shuffle(nums.slice());
    for (const n of order) {
      if (isValidPlacement(grid, r, c, n)) {
        grid[r][c] = n;
        if (backtrack(pos + 1)) return true;
        grid[r][c] = null;
      }
    }
    return false;
  }

  backtrack(0);
  return grid;
}

function makePuzzleFromFull(full, removals = 40) {
  const puzzle = cloneGrid(full);
  const cells = [];
  for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) cells.push([r, c]);
  shuffle(cells);
  let removed = 0;
  for (const [r, c] of cells) {
    if (removed >= removals) break;
    puzzle[r][c] = null;
    removed += 1;
  }
  return { puzzle, solution: full };
}

const Sudoku = () => {
  const [grid, setGrid] = useState(() =>
    Array.from({ length: 9 }, () => Array(9).fill(null))
  );
  const [givens, setGivens] = useState(() =>
    Array.from({ length: 9 }, () => Array(9).fill(false))
  );
  const [conflicts, setConflicts] = useState(() => new Set());
  const [selected, setSelected] = useState(null); // [r,c]

  // persistence key
  const STORAGE_KEY = "migozz:sudoku:v1";

  // helper to compute conflicts for a grid
  const computeConflicts = (next) => {
    const newConf = new Set();
    for (let rr = 0; rr < 9; rr++) {
      for (let cc = 0; cc < 9; cc++) {
        const val = next[rr][cc];
        if (!val) continue;
        for (let i = 0; i < 9; i++) {
          if (i !== cc && next[rr][i] === val) newConf.add(`${rr}-${cc}`);
          if (i !== rr && next[i][cc] === val) newConf.add(`${rr}-${cc}`);
        }
        const br = Math.floor(rr / 3) * 3;
        const bc = Math.floor(cc / 3) * 3;
        for (let r2 = br; r2 < br + 3; r2++) {
          for (let c2 = bc; c2 < bc + 3; c2++) {
            if ((r2 !== rr || c2 !== cc) && next[r2][c2] === val)
              newConf.add(`${rr}-${cc}`);
          }
        }
      }
    }
    return newConf;
  };

  useEffect(() => {
    // try to load saved state
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data && data.grid && data.givens) {
          setGrid(data.grid);
          setGivens(data.givens);
          setSolution(data.solution || null);
          setConflicts(computeConflicts(data.grid));
          setElapsed(data.elapsed || 0);
          setRunning(!!data.running);
          return;
        }
      }
    } catch (e) {
      // ignore and generate new
    }

    // no saved state -> generate new puzzle
    const full = generateFullGrid();
    const { puzzle, solution } = makePuzzleFromFull(full, CELLS_TO_SOLVE);
    setGrid(puzzle);
    setGivens(puzzle.map((r) => r.map((c) => !!c)));
    setSolution(solution);
    setConflicts(new Set());
  }, []);

  // timer state
  const [elapsed, setElapsed] = useState(0); // seconds
  const [running, setRunning] = useState(false);
  const [solution, setSolution] = useState(null);
  const [isDark, setIsDark] = useState(false);

  const updateCell = (r, c, raw) => {
    let v = raw.replace(/[^1-9]/g, "");
    if (v === "") v = null;
    else v = parseInt(v, 10);

    setGrid((prev) => {
      const next = cloneGrid(prev);
      next[r][c] = v;
      const newConf = new Set();
      for (let rr = 0; rr < 9; rr++) {
        for (let cc = 0; cc < 9; cc++) {
          const val = next[rr][cc];
          if (!val) continue;
          for (let i = 0; i < 9; i++) {
            if (i !== cc && next[rr][i] === val) newConf.add(`${rr}-${cc}`);
            if (i !== rr && next[i][cc] === val) newConf.add(`${rr}-${cc}`);
          }
          const br = Math.floor(rr / 3) * 3;
          const bc = Math.floor(cc / 3) * 3;
          for (let r2 = br; r2 < br + 3; r2++) {
            for (let c2 = bc; c2 < bc + 3; c2++) {
              if ((r2 !== rr || c2 !== cc) && next[r2][c2] === val)
                newConf.add(`${rr}-${cc}`);
            }
          }
        }
      }
      setConflicts(newConf);
      // persist
      try {
        const payload = {
          grid: next,
          givens,
          solution,
          elapsed,
          running,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      } catch (e) {}
      return next;
    });
  };

  // completion detection helper (moved up so other hooks can reference it)
  const isComplete = () => {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (!grid[r][c]) return false;
      }
    }
    return conflicts.size === 0;
  };

  // derived completed flag for rendering/effects
  const completed = isComplete();

  // when completed: stop timer and clear selection to remove highlights
  useEffect(() => {
    if (completed) {
      setRunning(false);
      setSelected(null);
    }
    // only depend on completed
  }, [completed]);

  // keyboard support and navigation (ignore when completed)
  useEffect(() => {
    const onKey = (e) => {
      if (completed) return;
      if (!selected) return;
      const [r, c] = selected;
      const isGiven = givens[r][c];

      if (isGiven) {
        // Only allow navigation, not value change
        if (e.key === "ArrowUp") {
          setSelected([(r + 8) % 9, c]);
          e.preventDefault();
        } else if (e.key === "ArrowDown") {
          setSelected([(r + 1) % 9, c]);
          e.preventDefault();
        } else if (e.key === "ArrowLeft") {
          setSelected([r, (c + 8) % 9]);
          e.preventDefault();
        } else if (e.key === "ArrowRight") {
          setSelected([r, (c + 1) % 9]);
          e.preventDefault();
        }
        e.preventDefault();
        return;
      }

      // navigation and value changes handled below
      if (/^[1-9]$/.test(e.key)) {
        updateCell(r, c, e.key);
        e.preventDefault();
      } else if (e.key === "0" || e.key === "Backspace" || e.key === "Delete") {
        updateCell(r, c, "");
        e.preventDefault();
      } else if (e.key === "ArrowUp") {
        setSelected([(r + 8) % 9, c]);
        e.preventDefault();
      } else if (e.key === "ArrowDown") {
        setSelected([(r + 1) % 9, c]);
        e.preventDefault();
      } else if (e.key === "ArrowLeft") {
        setSelected([r, (c + 8) % 9]);
        e.preventDefault();
      } else if (e.key === "ArrowRight") {
        setSelected([r, (c + 1) % 9]);
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, givens, completed]);

  // save whenever grid or elapsed/running changes
  useEffect(() => {
    try {
      const payload = { grid, givens, solution, elapsed, running };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {}
  }, [grid, givens, elapsed, running, solution]);

  // timer tick
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  // detect dark mode similar to other screens
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

  return (
    <div className="p-6 h-full min-h-[calc(100vh-56px)]">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between mb-4 w-full">
          <h1 className="text-2xl font-bold">Sudoku</h1>
          <div className="flex items-center gap-3 justify-end">
            <div className="text-base flex items-center gap-2">
              <span className="font-mono text-lg">
                {String(Math.floor(elapsed / 60)).padStart(2, "0")}:
                {String(elapsed % 60).padStart(2, "0")}
              </span>
              <button
                onClick={() => setRunning((r) => !r)}
                className="p-2 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center"
                aria-label={running ? "Pause timer" : "Start timer"}
              >
                {running ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </button>
            </div>
            <button
              onClick={() => {
                // regenerate
                const full = generateFullGrid();
                const { puzzle, solution } = makePuzzleFromFull(
                  full,
                  CELLS_TO_SOLVE
                );
                setGrid(puzzle);
                setGivens(puzzle.map((r) => r.map((c) => !!c)));
                setSolution(solution);
                setConflicts(new Set());
                setElapsed(0);
                setRunning(false);
              }}
              className="px-3 py-1 bg-blue-600 text-white rounded"
            >
              New Puzzle
            </button>
          </div>
        </div>
        <div className="w-full flex justify-center">
          <div className="border border-gray-300 dark:border-gray-600 inline-block relative">
            <div className="grid grid-cols-9 gap-0 w-max">
              {grid.map((row, r) =>
                row.map((cell, c) => {
                  const isGiven = givens[r][c];
                  const inConflict = conflicts.has(`${r}-${c}`);
                  const blockAlt =
                    (Math.floor(r / 3) + Math.floor(c / 3)) % 2 === 0;
                  const isSelected =
                    selected && selected[0] === r && selected[1] === c;
                  const isSameRow = selected && selected[0] === r;
                  const isSameCol = selected && selected[1] === c;
                  // highlight row/column unless the cell is a given
                  const rowColHighlight = isSameRow || isSameCol;
                  let backgroundStyle = "bg-gray-100 dark:bg-gray-800";
                  if (isGiven && rowColHighlight) {
                    backgroundStyle = "font-bold bg-amber-100 dark:bg-zinc-900";
                  } else if (isGiven && !rowColHighlight) {
                    backgroundStyle = "font-bold bg-gray-200 dark:bg-gray-900";
                  } else if (!isGiven && rowColHighlight) {
                    backgroundStyle = "bg-yellow-50 dark:bg-zinc-800";
                  } else if (!isGiven && !rowColHighlight) {
                    backgroundStyle = "bg-gray-100 dark:bg-gray-800";
                  }
                  return (
                    <input
                      key={`${r}-${c}`}
                      value={cell || ""}
                      readOnly={isGiven || completed}
                      disabled={isGiven || completed}
                      onFocus={() => {
                        setSelected([r, c]);
                        if (!running) setRunning(true);
                      }}
                      onClick={() => {
                        setSelected([r, c]);
                        if (!running) setRunning(true);
                      }}
                      onChange={(e) => updateCell(r, c, e.target.value)}
                      className={`box-border w-10 h-10 md:w-12 md:h-12 text-center appearance-none outline-none ${backgroundStyle} ${
                        inConflict
                          ? "text-red-600"
                          : "text-gray-900 dark:text-white"
                      } ${
                        isSelected && !completed
                          ? "border-2 border-blue-500 z-10"
                          : "border-1 border-transparent"
                      }`}
                      style={{
                        cursor: isSelected ? "default" : "text",
                        borderRight: isSelected
                          ? "2px solid #2b7fff"
                          : c % 3 === 2
                          ? "2px solid rgba(100,100,100,0.5)"
                          : "1px solid rgba(120,120,120,0.2)",
                        borderBottom: isSelected
                          ? "2px solid #2b7fff"
                          : r % 3 === 2
                          ? "2px solid rgba(100,100,100,0.5)"
                          : "1px solid rgba(120,120,120,0.2)",
                        caretColor: "transparent",
                      }}
                    />
                  );
                })
              )}
            </div>
            {/* overlay completion banner centered on grid */}
            {completed && (
              <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                aria-hidden
              >
                <div
                  className={`p-3 rounded-lg text-center text-lg font-semibold pointer-events-auto`}
                  style={{
                    background: isDark
                      ? "rgba(6,95,70,0.22)"
                      : "rgba(220,252,231,0.95)",
                    color: isDark ? "#ecfdf5" : "#065f46",
                    backdropFilter: "blur(6px)",
                    WebkitBackdropFilter: "blur(6px)",
                    boxShadow: isDark
                      ? "0 12px 30px rgba(2,6,23,0.6)"
                      : "0 6px 18px rgba(2,6,23,0.08)",
                    padding: "12px 20px",
                    minWidth: 160,
                  }}
                >
                  Completed puzzle in{" "}
                  {String(Math.floor(elapsed / 60)).padStart(2, "0")}:
                  {String(elapsed % 60).padStart(2, "0")}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* numpad - phone layout */}
        <div className="mt-6 flex justify-center">
          <div className="grid grid-cols-3 gap-3" style={{ width: 9 * 44 }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <button
                key={n}
                onClick={() => {
                  if (completed) return;
                  if (!selected) return;
                  const [r, c] = selected;
                  // Check if it's a given cell before updating
                  if (givens[r][c]) return;
                  updateCell(r, c, String(n));
                }}
                className="w-full h-12 md:w-full md:h-14 rounded bg-white dark:bg-gray-800 border flex items-center justify-center text-lg"
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => {
                if (!selected) return;
                const [r, c] = selected;
                // Check if it's a given cell before clearing
                if (givens[r][c]) return;
                updateCell(r, c, "");
              }}
              className="col-span-3 w-full h-12 md:h-14 text-lg font-600 rounded bg-red-400 text-white flex items-center justify-center"
            >
              Clear
            </button>
          </div>
        </div>

        {/* bottom duplicate banner removed - overlay banner is shown on the grid when completed */}
      </div>
    </div>
  );
};

export default Sudoku;
