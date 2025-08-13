/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./components/**/*.{js,vue,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./app.vue",
    "./error.vue"
  ],
  darkMode: 'class',
  corePlugins: {
    preflight: true,
  },
  theme: {
    extend: {
      colors: {
        // Linear Design System Colors
        primary: {
          50: "#f7f8f8",
          100: "#e6e6e6",
          200: "#d0d6e0",
          300: "#8a8f98",
          400: "#626971",
          500: "#5e6ad2",
          600: "#4b59c4",
          700: "#3847a8",
          800: "#2a3685",
          900: "#1f2765"
        },
        background: {
          primary: "#0f1014",
          secondary: "#151619",
          tertiary: "#1a1c20",
          overlay: "rgba(15, 16, 20, 0.8)",
          surface: "#1f2124",
          elevated: "#18191c"
        },
        text: {
          primary: "#f7f8f8",
          secondary: "rgba(255, 255, 255, 0.7)",
          tertiary: "#8a8f98",
          quaternary: "#62666d",
          inverse: "#ffffff",
          muted: "#91959c",
          disabled: "#d0d6e0"
        },
        status: {
          success: {
            DEFAULT: "#10b981",
            bg: "#0f1a15",
            border: "#1a2e1f"
          },
          warning: {
            DEFAULT: "#f59e0b",
            bg: "#1a1609",
            border: "#2e2416"
          },
          error: {
            DEFAULT: "#ef4444",
            bg: "#1a0f0f",
            border: "#2e1a1a"
          },
          info: {
            DEFAULT: "#3b82f6",
            bg: "#0f1419",
            border: "#1a2538"
          }
        },
        accent: {
          purple: "#5e6ad2",
          blue: "#6771c5",
          "blue-hover": "#5761b8",
          green: "#68cc58",
          orange: "#f2994a",
          red: "#c52828",
          yellow: "#deb949"
        },
        interactive: {
          hover: "rgba(255, 255, 255, 0.05)",
          active: "rgba(255, 255, 255, 0.1)",
          focus: "rgba(94, 106, 210, 0.3)",
          disabled: "rgba(40, 40, 40, 0.2)"
        },
        border: {
          DEFAULT: "#2d3139",
          muted: "#1a1c20",
          strong: "#363c45",
          accent: "#5e6ad2"
        },
        // Grey palette for Linear Design System
        grey: {
          50: "#f9fafb",
          100: "#f3f4f6", 
          200: "#e5e7eb",
          300: "#d1d5db",
          400: "#9ca3af",
          500: "#6b7280",
          600: "#4b5563",
          700: "#374151",
          800: "#1f2937",
          900: "#111827",
          950: "#0d1117"
        },
        // Keep existing Notion colors for backward compatibility
        notion: {
          black: '#000000',
          white: '#ffffff',
          gray: {
            50: '#f7f6f3',
            100: '#e9e9e7',
            300: '#37352f'
          }
        }
      },
      fontFamily: {
        sans: [
          'Pretendard Variable',
          'Pretendard',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'system-ui',
          'sans-serif'
        ],
        mono: [
          'JetBrains Mono',
          'Fira Code',
          'SF Mono',
          'Monaco',
          'Consolas',
          'Liberation Mono',
          'Courier New',
          'monospace'
        ]
      },
      fontSize: {
        'xs': '12px',
        'sm': '13px',
        'base': '14px',
        'md': '16px',
        'lg': '18px',
        'xl': '21px',
        '2xl': '24px',
        '3xl': '32px',
        '4xl': '40px',
        '5xl': '48px',
        '6xl': '56px'
      },
      fontWeight: {
        normal: '400',
        medium: '510',
        semibold: '538',
        bold: '600',
        extrabold: '700'
      },
      lineHeight: {
        tight: '1.1',
        normal: '1.5',
        relaxed: '1.75',
        loose: '2'
      },
      letterSpacing: {
        tighter: '-1.82px',
        tight: '-0.37px',
        normal: '0px',
        wide: '0.025em',
        wider: '0.05em'
      },
      spacing: {
        '0': '0px',
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
        '10': '40px',
        '12': '48px',
        '16': '64px',
        '20': '80px',
        '24': '96px',
        '32': '128px',
        '40': '160px',
        '48': '192px',
        '56': '224px',
        '64': '256px'
      },
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem'
      },
      borderRadius: {
        'none': '0px',
        'sm': '4px',
        'DEFAULT': '6px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '24px',
        'full': '9999px'
      },
      borderWidth: {
        '0': '0px',
        '1': '0.666667px',
        '2': '1px',
        '4': '2px',
        '8': '4px'
      },
      boxShadow: {
        'none': 'none',
        'sm': 'rgba(0, 0, 0, 0.1) 0px 1px 3px 0px',
        'DEFAULT': 'rgba(0, 0, 0, 0.1) 0px 1px 3px 0px, rgba(0, 0, 0, 0.06) 0px 1px 2px 0px',
        'md': 'rgba(0, 0, 0, 0.1) 0px 4px 6px -1px, rgba(0, 0, 0, 0.06) 0px 2px 4px -1px',
        'lg': 'rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px',
        'xl': 'rgba(0, 0, 0, 0.1) 0px 20px 25px -5px, rgba(0, 0, 0, 0.04) 0px 10px 10px -5px',
        'button': 'rgba(0, 0, 0, 0) 0px 8px 2px 0px, rgba(0, 0, 0, 0.01) 0px 5px 2px 0px, rgba(0, 0, 0, 0.04) 0px 3px 2px 0px, rgba(0, 0, 0, 0.07) 0px 1px 1px 0px, rgba(0, 0, 0, 0.08) 0px 0px 1px 0px',
        'inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)'
      },
      zIndex: {
        '0': '0',
        '10': '10',
        '20': '20',
        '30': '30',
        '40': '40',
        '50': '50',
        'auto': 'auto'
      }
    },
  },
  plugins: [],
}