/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        // Surfaces
        bg: 'var(--bg)',
        surface: {
          1: 'var(--surface-1)',
          2: 'var(--surface-2)',
          3: 'var(--surface-3)',
        },
        // Brand
        primary: {
          DEFAULT: 'var(--primary)',
          hover: 'var(--primary-hover)',
          pressed: 'var(--primary-pressed)',
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#4F46E5',
          600: '#4338CA',
          700: '#3730A3',
          800: '#312e81',
          900: '#1e1b4b',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
        },
        danger: {
          DEFAULT: 'var(--danger)',
        },
        warning: {
          DEFAULT: 'var(--warning)',
        },
        // Borders
        border: {
          DEFAULT: 'var(--border)',
          strong: 'var(--border-strong)',
        },
      },
      textColor: {
        DEFAULT: 'var(--text)',
        muted: 'var(--text-muted)',
        subtle: 'var(--text-subtle)',
        inverse: 'var(--text-inverse)',
      },
      borderRadius: {
        card: '12px',
        input: '10px',
        pill: '999px',
        modal: '16px',
      },
      boxShadow: {
        soft: 'var(--shadow-soft)',
        medium: 'var(--shadow-medium)',
      },
      ringColor: {
        DEFAULT: 'var(--ring)',
        weak: 'var(--ring-weak)',
      },
      transitionDuration: {
        fast: '150ms',
        normal: '200ms',
      },
      spacing: {
        '4.5': '1.125rem',
        '18': '4.5rem',
      },
    },
  },
  plugins: [],
}
