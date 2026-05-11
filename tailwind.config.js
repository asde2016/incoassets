/** @type {import('tailwindcss').Config} */
export default {
  // darkMode: ["class"],
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
    './error.vue',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Pretendard', 'sans-serif'],
      },
      screens: {
        sm: '360px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
      },
      spacing: {
        ...Object.fromEntries(
          Array.from({ length: 1000 }, (_, i) => [i + 1, `${(i + 1) / 16}rem`])
        ),
      },
      fontSize: {
        ...Object.fromEntries(Array.from({ length: 200 }, (_, i) => [i + 1, `${(i + 1) / 16}rem`])),
      },

      maxWidth: {
        sm: '24rem',
        md: '32rem',
        lg: '40rem',
        xl: '48rem',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
          hover: 'color-mix(in srgb, var(--primary), black 15%)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
          hover: 'color-mix(in srgb, var(--secondary), black 15%)',
          ring: 'color-mix(in srgb, var(--secondary) 50%, transparent)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
          hover: 'color-mix(in srgb, var(--muted), black 15%)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
          hover: 'color-mix(in srgb, var(--accent), black 15%)',
        },
        danger: {
          DEFAULT: 'var(--danger)',
          foreground: 'var(--danger-foreground)',
          hover: 'color-mix(in srgb, var(--danger), black 15%)',
          ring: 'color-mix(in srgb, var(--danger) 50%, transparent)',
        },
        success: {
          DEFAULT: 'var(--success)',
          foreground: 'var(--success-foreground)',
          hover: 'color-mix(in srgb, var(--success), black 15%)',
          ring: 'color-mix(in srgb, var(--success) 50%, transparent)',
        },
        info: {
          DEFAULT: 'var(--info)',
          foreground: 'var(--info-foreground)',
          hover: 'color-mix(in srgb, var(--info), black 15%)',
          ring: 'color-mix(in srgb, var(--info) 50%, transparent)',
        },
        warning: {
          DEFAULT: 'var(--warning)',
          foreground: 'var(--warning-foreground)',
          hover: 'color-mix(in srgb, var(--warning), black 15%)',
          ring: 'color-mix(in srgb, var(--warning) 50%, transparent)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
          hover: 'color-mix(in srgb, var(--destructive), black 15%)',
        },
        dark: {
          DEFAULT: 'var(--gray-900)',
          foreground: 'var(--white)',
          hover: 'color-mix(in srgb, var(--gray-900), black 15%)',
        },
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        gray: {
          100: 'var(--gray-100)',
          200: 'var(--gray-200)',
          300: 'var(--gray-300)',
          400: 'var(--gray-400)',
          500: 'var(--gray-500)',
          600: 'var(--gray-600)',
          700: 'var(--gray-700)',
          800: 'var(--gray-800)',
          900: 'var(--gray-900)',
        },
      },
      boxShadow: {
        DEFAULT: '0 5px 50px 0 rgba(60, 70, 65, 0.12)',
        down: '0 4px 6px rgba(0, 0, 0, 0.1)',
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--reka-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--reka-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
