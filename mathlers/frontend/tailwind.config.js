/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        arena: {
          red: '#ef4444',
          blue: '#3b82f6',
          gold: '#eab308',
          black: '#020617',
          gray: '#0f172a',
        }
      }
    },
  },
  plugins: [],
}
