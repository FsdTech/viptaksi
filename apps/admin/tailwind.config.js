export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        taxi: "#FFC107",
        taxiblack: "#0b0f19",
        taxigray: "#1a2233"
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    }
  },
  plugins: [],
}