/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["DM Sans", "system-ui", "sans-serif"],
        display: ["Outfit", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#eef8ff",
          100: "#d8edff",
          200: "#b9e0ff",
          300: "#89cfff",
          400: "#52b4ff",
          500: "#2a93f5",
          600: "#1874e8",
          700: "#145fd5",
          800: "#164cac",
          900: "#184287",
        },
      },
    },
  },
  plugins: [],
};
