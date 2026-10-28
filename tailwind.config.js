/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        campus: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc7fb',
          400: '#38aaf7',
          500: '#0e8ee9',
          600: '#0270c7',
          700: '#0359a1',
          800: '#074c85',
          900: '#0c406e',
          950: '#082849',
        },
        navy: {
          800: '#0f172a',
          900: '#0a1128',
          950: '#060a17',
        },
        accent: {
          cyan: '#06b6d4',
          teal: '#0d9488',
          emerald: '#10b981',
          amber: '#f59e0b',
        }
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)',
        'card': '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
        'card-hover': '0 10px 25px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.05)',
      }
    },
  },
  plugins: [],
}
