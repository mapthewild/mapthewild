/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // Foundation
        parchment: {
          DEFAULT: '#f5f0e6',
          dark: '#e8e3d9',
        },
        ink: {
          DEFAULT: '#4a3f35',
          light: '#6b5d4d',
          muted: '#8a7a66',
        },
        grid: {
          DEFAULT: '#b8a990',
          light: 'rgba(180, 170, 150, 0.12)',
        },
        white: '#ffffff',

        // Semantic accents
        ochre: {
          DEFAULT: '#c4a035',
          dark: '#9a7f2a',
          bg: 'rgba(196, 160, 53, 0.15)',
        },
        sienna: {
          DEFAULT: '#a03e20',
          light: '#b84c2d',
          bg: 'rgba(160, 62, 32, 0.15)',
        },
        verdigris: {
          DEFAULT: '#2d6a6a',
          bg: 'rgba(45, 106, 106, 0.12)',
        },
        rose: {
          DEFAULT: '#c9a0a0',
          dark: '#8a6b6b',
          bg: 'rgba(201, 160, 160, 0.25)',
        },
      },
      fontFamily: {
        serif: ['Georgia', 'Times New Roman', 'serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0,0,0,0.06)',
        'hover': '0 4px 12px rgba(0,0,0,0.1)',
      },
      spacing: {
        'grid': '40px',
      },
      borderRadius: {
        'sm': '4px',
        'md': '6px',
        'lg': '8px',
      },
    },
  },
  plugins: [],
}
