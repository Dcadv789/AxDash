/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        black: '#0F0F0F',
        gray: {
          900: '#121212',
          850: '#1A1A1A',
          800: '#1E1E1E',
          700: '#2D2D2D',
          600: '#3D3D3D',
          500: '#5C5C5C',
          400: '#7B7B7B',
          300: '#A0A0A0',
          200: '#C4C4C4',
          100: '#E1E1E1',
        },
        indigo: {
          500: '#3B82F6',
          600: '#2563EB',
        }
      },
      boxShadow: {
        'lg': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
    },
  },
  plugins: [],
};