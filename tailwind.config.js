/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#ff6fa8',
        'primary-light': '#ff82bb',
        'primary-dark': '#e55a8a',
        secondary: '#ff9fbd',
        accent: '#ffc0d0',
        background: '#fff5f8',
        'bg-card': '#ffffff',
        'text-primary': '#333333',
        'text-secondary': '#666666',
        'text-muted': '#999999',
        success: '#52c41a',
        warning: '#faad14',
        error: '#ff4d4f',
        gray: {
          100: '#f7f7f7',
          200: '#eeeeee',
          300: '#e0e0e0',
          400: '#bdbdbd',
          500: '#9e9e9e'
        }
      },
      fontFamily: {
        sans: ['PingFang SC', 'Microsoft YaHei', 'sans-serif']
      },
      borderRadius: {
        'lg': '12px',
        'xl': '16px',
        '2xl': '20px'
      },
      boxShadow: {
        card: '0 2px 12px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 4px 20px rgba(0, 0, 0, 0.12)'
      }
    },
  },
  plugins: [],
}