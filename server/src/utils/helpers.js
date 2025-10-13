// for coloring in terminal logging
const CONSOLE_RED = "\x1b[31m";
const CONSOLE_GREEN = "\x1b[32m";
const CONSOLE_RESET = "\x1b[0m";
const CONSOLE_YELLOW = "\x1b[33m";

export const outGreen = (data) => {
  return CONSOLE_GREEN + data + CONSOLE_RESET;
};

export const outRed = (data) => {
  return CONSOLE_RED + data + CONSOLE_RESET;
};

export const outYellow = (data) => {
  return CONSOLE_YELLOW + data + CONSOLE_RESET;
};
