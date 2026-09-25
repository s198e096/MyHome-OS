/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,jsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#16240F",
        heroTop: "#D3ECBC",
        heroBottom: "#BEE1A5",
        accent: "#F3EA6B",
      },
    },
  },
  plugins: [],
};
