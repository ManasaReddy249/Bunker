/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#102c36', primary: '#087f75', secondary: '#066b63', border: '#dce8e5', muted: '#687c79',
        'chart-primary': '#087f75', 'chart-secondary': '#88aaa1', 'status-valid': '#21836f', 'status-invalid': '#bf5b59',
        'status-pending': '#bb8436', 'chart-grid': '#e0eae7', 'chart-hover': '#eff6f3', text: '#233d3c', page: '#f2f6f3',
        success: '#21836f', warning: '#bb8436', danger: '#bf5b59'
      },
      boxShadow: {
        card: '0 12px 34px rgba(16, 44, 54, 0.07)'
      }
    }
  },
  plugins: []
};
