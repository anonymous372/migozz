import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

const getInitialTheme = () => {
  try {
    const stored = localStorage.getItem("theme");
    if (stored === "dark") return true;
    if (stored === "light") return false;
  } catch (e) {
    // ignore
  }

  if (typeof window !== "undefined") {
    return (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    );
  }

  return false;
};

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(getInitialTheme);

  useEffect(() => {
    const html = document.documentElement;
    if (darkMode) {
      html.classList.add("dark");
      try {
        localStorage.setItem("theme", "dark");
      } catch (e) {}
    } else {
      html.classList.remove("dark");
      try {
        localStorage.setItem("theme", "light");
      } catch (e) {}
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode((v) => !v);

  return (
    <ThemeContext.Provider value={{ darkMode, setDarkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
