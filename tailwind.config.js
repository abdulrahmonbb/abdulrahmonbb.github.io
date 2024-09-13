/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./pages/index.html"],
  theme: {
    extend: {
      colors: {
        "primary": "#4567B7",
        "secondary": "#D99058",
        "accent": "#FF7F50",
        "background": "#BEBFC5",
        "bg-dark": "#808080",
        "text": "#000080"
      },
      fontFamily: {
        prime: ['Ubuntu'],
        body: ['Poppins']
      }
    },
  },
  plugins: [],
}
