/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'vtv-dark': '#0b0f19',
        'vtv-surface': '#111827',
        'vtv-card': '#151e32',
        'vtv-card-border': 'rgba(255, 255, 255, 0.08)',
        'vtv-blue': '#2563eb',
        'vtv-indigo': '#6366f1',
        'vtv-green': '#10b981',
        'vtv-red': '#ef4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'neon-blue': '0 0 20px -3px rgba(37, 99, 235, 0.35)',
        'neon-indigo': '0 0 20px -3px rgba(99, 102, 241, 0.35)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      }
    },
  },
  plugins: [],
}
