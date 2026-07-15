const { heroui } = require('@heroui/react');

/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './src/**/*.{js,jsx}',
    './node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  darkMode: 'class',
  plugins: [heroui()],
};

module.exports = config;
