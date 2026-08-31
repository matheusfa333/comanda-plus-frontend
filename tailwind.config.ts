import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#c45c2a',
        secondary: '#3d5c3a',
        light: '#faf6ef',
        dark: '#2a1f14',
      },
    },
  },
  plugins: [],
}
export default config
