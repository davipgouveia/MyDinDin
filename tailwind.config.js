/** @type {import('tailwindcss').Config} */
export default {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#111827',
        card: '#1f2937',
        income: '#22c55e',
        expense: '#ef4444',
        accent: '#06b6d4',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(6, 182, 212, 0.3), 0 10px 30px rgba(2, 132, 199, 0.2)',
      },
    },
  },
  plugins: [],
}
