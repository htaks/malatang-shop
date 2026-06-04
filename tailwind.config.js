/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      keyframes: {
        bubble: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        coinPop: {
          '0%': { opacity: '1', transform: 'translateY(0) scale(1)' },
          '100%': { opacity: '0', transform: 'translateY(-60px) scale(1.5)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-6px)' },
          '40%': { transform: 'translateX(6px)' },
          '60%': { transform: 'translateX(-4px)' },
          '80%': { transform: 'translateX(4px)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        steam: {
          '0%': { opacity: '0.6', transform: 'translateY(0) scaleX(1)' },
          '100%': { opacity: '0', transform: 'translateY(-30px) scaleX(1.5)' },
        },
      },
      animation: {
        bubble: 'bubble 2s ease-in-out infinite',
        coinPop: 'coinPop 0.8s ease-out forwards',
        shake: 'shake 0.4s ease-in-out',
        fadeIn: 'fadeIn 0.3s ease-out',
        steam: 'steam 1.5s ease-out infinite',
      },
    },
  },
  plugins: [],
}
