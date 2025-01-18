/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        customBlue: '#192434',
        customHoverBlue: '#1D4ED8',
      },
    },
  },
  plugins: [],
}

