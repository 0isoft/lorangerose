/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        lorange: ["LorangeRose", "sans-serif"],
      },
    
        fontFamily: {
          edo: ['edo', 'sans-serif'],
        },
      
      colors: {
        brand: {
          red:   "#C81D25", // red
          beige: "#F7EBD9", // beige
          line:  "#4C0C27", // divider line
          orange:"#FFB96B", // light orange
          ink:   "#0B0B0B", // near-black
        },
      },
      boxShadow: {
        "btn-raise": "0 2px 0 0 rgba(0,0,0,.35)",
        "btn-float": "0 8px 24px rgba(200,29,37,.35)",
      },
    },
  },
  plugins: []
}
