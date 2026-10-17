/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        base: {
          950: '#07080a',
          900: '#0b0d10',
          850: '#0f1114',
          800: '#14171b',
          750: '#191d22',
          700: '#20252b',
          600: '#2b3138',
        },
        ink: {
          100: '#f3f5f7',
          200: '#d5dae0',
          300: '#aeb5be',
          400: '#8a919b',
          500: '#6b727c',
          600: '#525860',
        },
        accent: {
          300: '#7dffb4',
          400: '#4dffa0',
          500: '#22f47f',
          600: '#12c866',
          700: '#0e9e51',
        },
        danger: {
          400: '#ff7a7a',
          500: '#f5555a',
          600: '#d83a3f',
        },
        warn: {
          400: '#ffcf6b',
          500: '#f5b340',
        },
      },
      boxShadow: {
        panel: '0 1px 0 0 rgba(255,255,255,0.03) inset, 0 12px 32px -20px rgba(0,0,0,0.9)',
        glow: '0 0 0 1px rgba(34,244,127,0.35), 0 8px 30px -12px rgba(34,244,127,0.45)',
      },
      borderRadius: {
        xl: '0.9rem',
        '2xl': '1.25rem',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(16px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-up': 'slide-up 0.25s ease-out',
        'slide-in-right': 'slide-in-right 0.25s ease-out',
      },
    },
  },
  plugins: [],
};
