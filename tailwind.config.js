/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        neon: {
          blue: '#00ffff',
          pink: '#ff00ff',
          purple: '#9d00ff'
        },
        dark: {
          50: '#f3f0ff',
          100: '#e9e3ff',
          200: '#d4c6ff',
          300: '#b69eff',
          400: '#9871ff',
          500: '#7c45ff',
          600: '#6d28d9',
          700: '#5b21b6',
          800: '#4c1d95',
          900: '#2e1065',
          950: '#1a0745'
        },
        eggplant: {
          50: '#fdf2ff',
          100: '#fae5ff',
          200: '#f5ccff',
          300: '#f0a3ff',
          400: '#e770ff',
          500: '#d43aff',
          600: '#b91aef',
          700: '#9c14cc',
          800: '#8015a5',
          900: '#671585',
          950: '#3f0d52'
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(var(--tw-gradient-stops))',
        'gradient-shine': 'linear-gradient(45deg, transparent 25%, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.1) 50%, transparent 50%, transparent 75%, rgba(255,255,255,0.1) 75%, rgba(255,255,255,0.1))'
      },
      boxShadow: {
        'neon-blue': '0 0 5px #00ffff, 0 0 20px rgba(0, 255, 255, 0.3)',
        'neon-pink': '0 0 5px #ff00ff, 0 0 20px rgba(255, 0, 255, 0.3)',
        'neon-purple': '0 0 5px #9d00ff, 0 0 20px rgba(157, 0, 255, 0.3)'
      },
      animation: {
        'gradient-x': 'gradient-x 15s ease infinite',
        'gradient-y': 'gradient-y 15s ease infinite',
        'gradient-xy': 'gradient-xy 15s ease infinite',
        'cursor-gradient': 'cursor-gradient 3s ease infinite'
      },
      keyframes: {
        'gradient-y': {
          '0%, 100%': {
            'background-size': '400% 400%',
            'background-position': 'center top'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'center center'
          }
        },
        'gradient-x': {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          }
        },
        'gradient-xy': {
          '0%, 100%': {
            'background-size': '400% 400%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          }
        },
        'cursor-gradient': {
          '0%': { transform: 'translate(0, 0)' },
          '50%': { transform: 'translate(10px, 10px)' },
          '100%': { transform: 'translate(0, 0)' }
        }
      }
    }
  },
  plugins: []
};