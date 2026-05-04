import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // FITLEEX brand — from HTML prototypes
        brand: {
          DEFAULT: '#C8F04B',
          50:  '#f6fde0',
          100: '#ecfbc1',
          200: '#d9f682',
          300: '#C8F04B',
          400: '#aed630',
          500: '#8ab321',
          600: '#6a8c18',
          700: '#506a15',
          800: '#3c5014',
          900: '#2e3d0f',
        },
        surface: {
          DEFAULT: '#111111',
          50:  '#f5f5f5',
          100: '#1a1a1a',
          200: '#222222',
          300: '#2a2a2a',
          400: '#333333',
        },
        background: '#0a0a0a',
        foreground: '#ffffff',
        muted: {
          DEFAULT: '#888888',
          foreground: '#666666',
        },
        border: '#2a2a2a',
        // Status colors
        success:  '#4CAF50',
        warning:  '#FF8C42',
        danger:   '#FF4D4D',
        info:     '#4D9EFF',
      },
      fontFamily: {
        sans:    ['var(--font-dm-sans)', 'DM Sans', 'system-ui', 'sans-serif'],
        display: ['var(--font-bebas)', 'Bebas Neue', 'sans-serif'],
        mono:    ['var(--font-dm-mono)', 'DM Mono', 'monospace'],
        arabic:  ['var(--font-cairo)', 'Cairo', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        sm:  '0.375rem',
        md:  '0.5rem',
        lg:  '0.75rem',
        xl:  '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        card:  '0 0 0 1px rgba(255,255,255,0.06)',
        glow:  '0 0 20px rgba(200,240,75,0.25)',
        'glow-sm': '0 0 10px rgba(200,240,75,0.15)',
      },
      animation: {
        'fade-in':   'fadeIn 0.2s ease-out',
        'slide-up':  'slideUp 0.3s ease-out',
        'pulse-dot': 'pulseDot 2s infinite',
      },
      keyframes: {
        fadeIn:   { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp:  { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        pulseDot: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.4' } },
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #C8F04B 0%, #8ab321 100%)',
        'dark-gradient':  'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
        'card-gradient':  'linear-gradient(135deg, #1a1a1a 0%, #111111 100%)',
      },
    },
  },
  plugins: [],
}

export default config
