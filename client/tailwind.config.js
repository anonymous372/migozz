export default {
  darkMode: "class", // 👈 tells Tailwind to use the .dark class
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: { extend: {} },
  plugins: [require("tailwind-scrollbar-hide")],
};
