/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        surface: {
          DEFAULT: 'rgba(255, 255, 255, 0.6)',
          solid: '#ffffff',
          muted: 'rgba(255, 255, 255, 0.4)',
        },
      },
      backdropBlur: {
        glass: '16px',
      },
      boxShadow: {
        glass: '0 8px 32px rgba(0, 0, 0, 0.06)',
        'glass-sm': '0 4px 16px rgba(0, 0, 0, 0.04)',
        'glass-lg': '0 12px 48px rgba(0, 0, 0, 0.08)',
      },
      borderRadius: {
        glass: '1rem',
        'glass-lg': '1.5rem',
      },
    },
  },
  plugins: [],
}

