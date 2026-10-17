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
      },
    },
  },
  plugins: [],
};
