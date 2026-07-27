import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        united: {
          red: '#da291c',
          gold: '#fbe122',
          black: '#1f1f1f',
        },
      },
      boxShadow: {
        subtle: '0 10px 24px rgb(15 23 42 / 0.08)',
      },
    },
  },
  plugins: [],
} satisfies Config;
