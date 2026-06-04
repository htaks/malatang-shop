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
        conveyorMove: {
          '0%': { transform: 'translateX(110%)' },
          '100%': { transform: 'translateX(-120%)' },
        },
        dropIn: {
          '0%': { transform: 'translateY(-40px) scale(1.5)', opacity: '1' },
          '60%': { transform: 'translateY(8px) scale(0.9)', opacity: '1' },
          '80%': { transform: 'translateY(-4px) scale(1.05)', opacity: '1' },
          '100%': { transform: 'translateY(0) scale(1)', opacity: '0' },
        },
        angerFill: {
          '0%': { width: '0%' },
          '100%': { width: '100%' },
        },
        customerReact: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.4)' },
          '100%': { transform: 'scale(1)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        letterReveal: {
          '0%': { opacity: '0', transform: 'translateY(-20px) scale(0.8)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        scorePop: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)' },
        },
        screenShake: {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '10%': { transform: 'translate(-4px, -2px)' },
          '20%': { transform: 'translate(4px, 2px)' },
          '30%': { transform: 'translate(-3px, 3px)' },
          '40%': { transform: 'translate(3px, -3px)' },
          '50%': { transform: 'translate(-2px, 2px)' },
          '60%': { transform: 'translate(2px, -2px)' },
          '70%': { transform: 'translate(-1px, 1px)' },
          '80%': { transform: 'translate(1px, 1px)' },
          '90%': { transform: 'translate(0px, -1px)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(251,146,60,0.3)' },
          '50%': { boxShadow: '0 0 25px rgba(251,146,60,0.7), 0 0 50px rgba(251,146,60,0.3)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(40px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        floatUp: {
          '0%': { opacity: '1', transform: 'translateY(0) scale(1)' },
          '100%': { opacity: '0', transform: 'translateY(-80px) scale(0.5)' },
        },
      },
      animation: {
        bubble: 'bubble 2s ease-in-out infinite',
        coinPop: 'coinPop 0.8s ease-out forwards',
        shake: 'shake 0.4s ease-in-out',
        fadeIn: 'fadeIn 0.3s ease-out',
        steam: 'steam 1.5s ease-out infinite',
        conveyorMove: 'conveyorMove linear forwards',
        dropIn: 'dropIn 0.6s ease-out forwards',
        customerReact: 'customerReact 0.5s ease-in-out',
        slideUp: 'slideUp 0.4s ease-out',
        gradientShift: 'gradientShift 8s ease infinite',
        letterReveal: 'letterReveal 0.5s ease-out forwards',
        scorePop: 'scorePop 0.3s ease-in-out',
        screenShake: 'screenShake 0.5s ease-in-out',
        glowPulse: 'glowPulse 2s ease-in-out infinite',
        slideInRight: 'slideInRight 0.4s ease-out',
        floatUp: 'floatUp 0.9s ease-out forwards',
      },
    },
  },
  plugins: [],
}
