/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Core surface palette — warm paper whites
        paper: {
          50: '#FFFFFF',
          100: '#FAFAF7',
          200: '#F4F4EE',
          300: '#EBEBE3',
          400: '#D8D8CE',
          500: '#B8B8AC',
          600: '#8A8A7E',
          700: '#5C5C54',
          800: '#363632',
          900: '#1A1A18',
        },
        signal: {
          50: '#FFF8E6',
          100: '#FFEFC2',
          200: '#FFE48A',
          300: '#FFD866',
          400: '#FFC73D',
          500: '#FFB000',
          600: '#E89A00',
          700: '#B87700',
          800: '#8A5A00',
        },
        md: '#00A87D',
        mkt: '#E8456A',
        visual: '#5878E8',
        alert: '#E63946',
        success: '#00A87D',
        warning: '#E89A00',
      },
      fontFamily: {
        display: ['Pretendard', 'system-ui', 'sans-serif'],
        sans: ['Pretendard', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        '2xs': '0.6875rem',
      },
      animation: {
        'pulse-signal': 'pulse-signal 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slide-up 0.4s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        'pulse-signal': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.6', transform: 'scale(1.1)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
