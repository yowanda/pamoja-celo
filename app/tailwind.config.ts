import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx,js,jsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Legacy Celo palette (still used by some surfaces / accent gradients).
        celo: {
          DEFAULT: '#FCFF52',
          dark: '#476520',
          forest: '#02513B',
          fig: '#1E002B',
        },
        // Refined design system — anchors on Celo forest green with a warm
        // off-white background so the UI feels closer to a polished fintech
        // product than a hackathon demo.
        ink: {
          DEFAULT: '#0B1413',
          muted: '#4B5563',
          subtle: '#6B7280',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          sunken: '#F5F4EF',
          warm: '#FAFAF5',
        },
        accent: {
          DEFAULT: '#FCFF52',
          ink: '#02513B',
        },
        brand: {
          50: '#E8F5F0',
          100: '#C8E6D9',
          200: '#92CFB4',
          300: '#5DB890',
          400: '#2FA070',
          500: '#02513B',
          600: '#024333',
          700: '#03362A',
          800: '#022A21',
          900: '#021F18',
        },
        border: {
          DEFAULT: '#E2E5DC',
          strong: '#C9CEC0',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-sans)', 'ui-sans-serif', 'system-ui'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 20, 19, 0.04), 0 8px 24px -12px rgba(2, 81, 59, 0.12)',
        cardHover: '0 1px 2px rgba(15, 20, 19, 0.06), 0 16px 32px -16px rgba(2, 81, 59, 0.2)',
        inset: 'inset 0 1px 0 rgba(255, 255, 255, 0.06)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      backgroundImage: {
        'mesh-forest':
          'radial-gradient(at 0% 0%, #024333 0%, transparent 50%), radial-gradient(at 100% 0%, #2FA070 0%, transparent 50%), radial-gradient(at 100% 100%, #02513B 0%, transparent 50%), radial-gradient(at 0% 100%, #022A21 0%, transparent 50%)',
        'grid-light':
          'linear-gradient(to right, rgba(2, 81, 59, 0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(2, 81, 59, 0.06) 1px, transparent 1px)',
      },
    },
  },
  plugins: [],
};

export default config;
