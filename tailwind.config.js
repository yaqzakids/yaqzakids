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
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        sans: ['Nunito', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
