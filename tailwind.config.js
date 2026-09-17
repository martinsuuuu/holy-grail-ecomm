/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: 'rgb(var(--color-primary-50-rgb) / <alpha-value>)',
          100: 'rgb(var(--color-primary-100-rgb) / <alpha-value>)',
          200: 'rgb(var(--color-primary-200-rgb) / <alpha-value>)',
          300: 'rgb(var(--color-primary-300-rgb) / <alpha-value>)',
          400: 'rgb(var(--color-primary-400-rgb) / <alpha-value>)',
          500: 'rgb(var(--color-primary-500-rgb) / <alpha-value>)',
          600: 'rgb(var(--color-primary-600-rgb) / <alpha-value>)',
          700: 'rgb(var(--color-primary-700-rgb) / <alpha-value>)',
          800: 'rgb(var(--color-primary-800-rgb) / <alpha-value>)',
          900: 'rgb(var(--color-primary-900-rgb) / <alpha-value>)',
        },
        plum: {
          50: '#F8F2F5',
          100: '#EFE0E8',
          200: '#DCC0CE',
          300: '#C29AB1',
          400: '#A57893',
          500: '#8B5C77',
          600: '#734960',
          700: '#5C3A4C',
          800: '#452C39',
          900: '#301F28',
        },
        cream: 'rgb(var(--color-cream-rgb) / <alpha-value>)',
        espresso: 'rgb(var(--color-espresso-rgb) / <alpha-value>)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Arial Black', 'sans-serif'],
        sans: ['var(--font-sans-active)', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 3px rgba(0, 0, 0, 0.06)',
        warm: '0 12px 32px -8px rgba(0, 0, 0, 0.18)',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        marquee: 'marquee 22s linear infinite',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
