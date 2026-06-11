/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'Consolas', 'monospace'],
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
      },
      colors: {
        neon: {
          cyan: '#22d3ee',
          purple: '#a855f7',
          pink: '#f472b6',
          green: '#4ade80',
          red: '#f87171',
          yellow: '#facc15',
        },
        bg: {
          dark: '#0f172a',
          darker: '#020617',
          card: 'rgba(30, 41, 59, 0.7)',
        }
      },
      animation: {
        'glow-pulse': 'glow-pulse 1.5s ease-in-out infinite',
        'fall': 'fall linear forwards',
        'float-up': 'float-up 0.8s ease-out forwards',
        'shake': 'shake 0.3s ease-in-out',
        'flash': 'flash 0.4s ease-out',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 5px currentColor, 0 0 10px currentColor' },
          '50%': { boxShadow: '0 0 20px currentColor, 0 0 40px currentColor' },
        },
        'float-up': {
          '0%': { transform: 'translateY(0)', opacity: '1' },
          '100%': { transform: 'translateY(-60px)', opacity: '0' },
        },
        'shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' },
        },
        'flash': {
          '0%': { opacity: '0.8' },
          '100%': { opacity: '0' },
        },
      },
      boxShadow: {
        'neon-cyan': '0 0 10px #22d3ee, 0 0 20px rgba(34, 211, 238, 0.5)',
        'neon-purple': '0 0 10px #a855f7, 0 0 20px rgba(168, 85, 247, 0.5)',
        'neon-pink': '0 0 10px #f472b6, 0 0 20px rgba(244, 114, 182, 0.5)',
        'neon-green': '0 0 10px #4ade80, 0 0 20px rgba(74, 222, 128, 0.5)',
        'neon-red': '0 0 10px #f87171, 0 0 20px rgba(248, 113, 113, 0.5)',
      },
    },
  },
  plugins: [],
};
