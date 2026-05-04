/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#f5b700',
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f5b700',
          600: '#d49e00',
          700: '#b8860b',
          800: '#92700a',
          900: '#78590a',
        },
        dark: {
          DEFAULT: '#0a0a0a',
          50: '#1a1a1a',
          100: '#161616',
          200: '#121212',
          300: '#0f0f0f',
          400: '#0a0a0a',
          500: '#050505',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
