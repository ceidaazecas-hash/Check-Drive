/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        google: {
          blue: '#1a73e8',
          hover: '#1557b0',
          green: '#1e8e3e',
          red: '#d93025',
          yellow: '#f9ab00',
          gray: '#5f6368',
          bg: '#f8f9fa'
        }
      }
    },
  },
  plugins: [],
}
