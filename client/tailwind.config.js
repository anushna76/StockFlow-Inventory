export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ['"IBM Plex Sans"', "system-ui", "sans-serif"] },
      colors: {
        ink: "#1f2a37",
        paper: "#f6f7f5",
        pine: { 600: "#2f6f5e", 700: "#255a4c", 50: "#eaf3f0" },
        amber: { 600: "#b45309", 50: "#fef3e2" },
      },
    },
  },
  plugins: [],
};
