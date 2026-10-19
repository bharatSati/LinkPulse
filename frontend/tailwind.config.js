/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        display: ['"Chakra Petch"', '"JetBrains Mono"', 'ui-sans-serif', 'sans-serif'],
      },
      fontSize: {
        xs: ['0.8125rem', { lineHeight: '1.125rem' }],
        sm: ['0.9375rem', { lineHeight: '1.375rem' }],
        base: ['1.0625rem', { lineHeight: '1.625rem' }],
        lg: ['1.1875rem', { lineHeight: '1.875rem' }],
        xl: ['1.3125rem', { lineHeight: '1.875rem' }],
        '2xl': ['1.625rem', { lineHeight: '2.125rem' }],
        '3xl': ['2rem', { lineHeight: '2.375rem' }],
        '4xl': ['2.375rem', { lineHeight: '2.625rem' }],
        '5xl': ['3.125rem', { lineHeight: '1' }],
      },
      colors: {
        base: {
          950: '#04070a',
          900: '#090e13',
          850: '#0e141a',
          800: '#141d24',
          750: '#1b262f',
          700: '#24323c',
          600: '#33454f',
        },
        ink: {
          100: '#eef6f5',
          200: '#d2e2e0',
          300: '#a6bcba',
          400: '#7d9391',
          500: '#5e7371',
          600: '#455654',
        },
        accent: {
          300: '#eaffab',
          400: '#d4ff5e',
          500: '#c1ff2e',
          600: '#9ee01a',
          700: '#78b000',
        },
        neon: {
          300: '#a6fff4',
          400: '#5cffe8',
          500: '#22e6d0',
          600: '#12b8a6',
          700: '#0c8c7e',
        },
        danger: {
          400: '#ff9db1',
          500: '#ff5c85',
          600: '#d61e57',
        },
        warn: {
          400: '#ffd166',
          500: '#ffb020',
        },
      },
      backgroundImage: {
        'accent-gradient': 'linear-gradient(120deg, #c1ff2e 0%, #22e6d0 100%)',
        'accent-gradient-soft':
          'linear-gradient(120deg, rgba(193,255,46,0.16) 0%, rgba(34,230,208,0.16) 100%)',
      },
      boxShadow: {
        panel:
          '4px 4px 0 0 rgba(0,0,0,0.85), inset 0 0 0 1px rgba(193,255,46,0.08)',
        glow: '0 0 0 1px rgba(193,255,46,0.6), 4px 4px 0 0 rgba(0,0,0,0.85), 0 0 22px -2px rgba(34,230,208,0.55)',
        'glow-neon':
          '0 0 0 1px rgba(34,230,208,0.6), 0 0 20px -2px rgba(34,230,208,0.6)',
        inset: 'inset 0 0 0 1px rgba(193,255,46,0.15)',
      },
      borderRadius: {
        none: '0px',
        sm: '0px',
        DEFAULT: '0px',
        md: '0px',
        lg: '0px',
        xl: '0px',
        '2xl': '0px',
        '3xl': '0px',
        full: '9999px',
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
        blink: {
          '0%, 49%': { opacity: '1' },
          '50%, 100%': { opacity: '0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-14px)' },
        },
        'grid-pan': {
          from: { backgroundPosition: '0 0' },
          to: { backgroundPosition: '0 48px' },
        },
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.55' },
          '50%': { opacity: '1' },
        },
        'page-in': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'pop-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'slide-in-left': {
          from: { opacity: '0', transform: 'translateX(-16px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'bar-grow': {
          from: { transform: 'scaleX(0)' },
          to: { transform: 'scaleX(1)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.8)', opacity: '0.8' },
          '70%, 100%': { transform: 'scale(1.9)', opacity: '0' },
        },
        'toast-progress': {
          from: { transform: 'scaleX(1)' },
          to: { transform: 'scaleX(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s steps(4, end)',
        'slide-up': 'slide-up 0.18s steps(4, end)',
        'slide-in-right': 'slide-in-right 0.18s steps(4, end)',
        blink: 'blink 1s steps(1, end) infinite',
        float: 'float 6s ease-in-out infinite',
        'grid-pan': 'grid-pan 2.4s linear infinite',
        marquee: 'marquee 26s linear infinite',
        shimmer: 'shimmer 8s linear infinite',
        'pulse-glow': 'pulse-glow 2.6s ease-in-out infinite',
        'page-in': 'page-in 0.24s steps(6, end) both',
        'pop-in': 'pop-in 0.18s steps(4, end) both',
        'slide-in-left': 'slide-in-left 0.18s steps(4, end) both',
        'bar-grow': 'bar-grow 0.6s steps(8, end) both',
        'pulse-ring': 'pulse-ring 2s ease-out infinite',
        'toast-progress': 'toast-progress 4.5s linear forwards',
      },
    },
  },
  plugins: [],
};
