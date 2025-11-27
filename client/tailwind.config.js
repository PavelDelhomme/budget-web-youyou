/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // Active le dark mode via la classe 'dark' sur l'élément parent
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

