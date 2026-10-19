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
          950: '#0b0e06',
          900: '#141a0c',
          850: '#1b2310',
          800: '#242f15',
          750: '#2f3d1c',
          700: '#415127',
          600: '#5a6c34',
        },
        ink: {
          100: '#f4fce0',
          200: '#e2eec4',
          300: '#c4d39c',
          400: '#9dac78',
          500: '#7a8858',
          600: '#5d6a41',
        },
        accent: {
          300: '#f2ffb8',
          400: '#e0f96e',
          500: '#cdf23f',
          600: '#a8cc24',
          700: '#83a116',
        },
        citrus: {
          300: '#fff0a8',
          400: '#ffe066',
          500: '#ffd21f',
          600: '#d9ac00',
          700: '#a58200',
        },
        danger: {
          400: '#ff9a8f',
          500: '#ff6b5f',
          600: '#dc4433',
        },
        warn: {
          400: '#ffcf6b',
          500: '#ffb000',
        },
      },
      backgroundImage: {
        'accent-gradient': 'linear-gradient(120deg, #cdf23f 0%, #ffd21f 100%)',
        'accent-gradient-soft':
          'linear-gradient(120deg, rgba(205,242,63,0.16) 0%, rgba(255,210,31,0.16) 100%)',
      },
      boxShadow: {
        panel:
          '4px 4px 0 0 rgba(0,0,0,0.85), inset 0 0 0 1px rgba(205,242,63,0.08)',
        glow: '0 0 0 1px rgba(205,242,63,0.6), 4px 4px 0 0 rgba(0,0,0,0.85), 0 0 22px -2px rgba(205,242,63,0.6)',
        'glow-citrus':
          '0 0 0 1px rgba(255,210,31,0.6), 0 0 20px -2px rgba(255,210,31,0.6)',
        inset: 'inset 0 0 0 1px rgba(205,242,63,0.15)',
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
