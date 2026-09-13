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
          50: '#FBF7F0',
          100: '#F6EDDC',
          200: '#ECDBB5',
          300: '#DFC48A',
          400: '#D3AF6C',
          500: '#C6A15B',
          600: '#B08A45',
          700: '#8F6E37',
          800: '#6E552C',
          900: '#524121',
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
        cream: '#FFFFFF',
        espresso: '#0B3D2E',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Arial Black', 'sans-serif'],
        sans: ['var(--font-body)', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 3px rgba(0, 0, 0, 0.06)',
        warm: '0 12px 32px -8px rgba(0, 0, 0, 0.18)',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
