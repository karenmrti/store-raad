/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        mm: {
          red: "#E30613",
          "red-dark": "#9E0410",
          "red-deep": "#4A0207",
          blue: "#0A7CFF",
          green: "#1FB24A",
          yellow: "#FFC81E",
          gold: "#F5B301",
          ink: "#14070A",
        },
      },
      fontFamily: {
        display: ['"Lilita One"', '"Arial Black"', "Impact", "system-ui", "sans-serif"],
        body: ['"Nunito"', "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
};
