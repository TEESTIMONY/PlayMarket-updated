/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ['Eras Bold ITC', 'sans-serif'],
        body: ['Eras Demi ITC', 'sans-serif'],
      },
      colors: {
        red: '#E63946',
        yellow: '#FFD438',
        green: '#019D88',
        black: '#1A1A1A',
        white: '#FFFFFF',
      },
    },
  },
  plugins: [],
} 