/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--color-bg)',
        navy: 'var(--color-navy)',
        teal: 'var(--color-teal)',
        gold: 'var(--color-gold)',
        purple: 'var(--color-purple)',
        coral: 'var(--color-coral)',
        muted: 'var(--color-muted)',
        border: '#E5E7EB',
        'gold-dark': '#D4820A',
        'navy-deep': '#243B6E',
        'purple-dark': '#5B3D8A',
        'muted-foreground': 'var(--color-muted)',
        cream: '#FFFBF0',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        sans: ['Nunito', 'sans-serif'],
        arabic: ['Nunito', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
