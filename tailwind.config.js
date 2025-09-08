/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        // --- MODIFICATION ICI ---
        // On ajoute 'group-hover:pause' pour que l'animation se mette en pause
        // lorsque la souris est sur l'élément parent ayant la classe 'group'.
        marquee: 'marquee 70s linear infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
      },
      // On ajoute la propriété 'animationPlayState' pour la pause
      animationPlayState: {
        'pause': 'paused',
      },
    },
  },
  // On ajoute le plugin pour les variantes 'group-hover'
  plugins: [
    function ({ addVariant }) {
      addVariant('group-hover', '.group:hover &');
    }
  ],
};
