import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";

import Layout from "./components/Layout";
import LandingPage from "./screens/LandingPage";
import Login from "./screens/Login";
import Register from "./screens/Register";
import HomePage from "./screens/HomePage";
import Games from "./screens/Games";
import TicTacToe from "./screens/games/TicTacToe";
import Sudoku from "./screens/games/Sudoku";
import ProtectedRoute from "./components/ProtectedRoute";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import TicTacToeMultiplayer from "./screens/games/TicTacToeMultiplayer";

ReactDOM.createRoot(document.getElementById("root")).render(
  <ThemeProvider>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/home"
              element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/games"
              element={
                <ProtectedRoute>
                  <Games />
                </ProtectedRoute>
              }
            />
            <Route
              path="/games/tictactoe"
              element={
                <ProtectedRoute>
                  <TicTacToe />
                </ProtectedRoute>
              }
            />
            <Route
              path="/games/sudoku"
              element={
                <ProtectedRoute>
                  <Sudoku />
                </ProtectedRoute>
              }
            />
            <Route
              path="/games/tictactoeonline"
              element={
                <ProtectedRoute>
                  <TicTacToeMultiplayer />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </ThemeProvider>
);
