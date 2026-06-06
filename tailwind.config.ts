import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      boxShadow: {
        glow: '0 0 0 1px rgba(148, 163, 184, 0.12), 0 24px 64px -32px rgba(15, 23, 42, 0.8)',
      },
    },
  },
  plugins: [],
};

export default config;
