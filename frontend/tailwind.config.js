/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Material Design Dark Theme Colors
        surface: {
          DEFAULT: '#121212',
          '1dp': '#1e1e1e',   // 5% white overlay
          '2dp': '#222222',   // 7% white overlay
          '3dp': '#242424',   // 8% white overlay
          '4dp': '#272727',   // 9% white overlay
          '6dp': '#2c2c2c',   // 11% white overlay
          '8dp': '#2e2e2e',   // 12% white overlay
          '12dp': '#333333',  // 14% white overlay
          '16dp': '#363636',  // 15% white overlay
          '24dp': '#383838',  // 16% white overlay
        },
        // Primary - Red/Crimson from custom palette
        primary: {
          DEFAULT: '#CC2454',    // Main primary color
          light: '#EC646C',      // Lighter variant for hover states
          lighter: '#f5577a',    // Even lighter
          dark: '#be2245',       // Darker variant
          darker: '#8c212a',     // Even darker
          50: '#fdedee',
          100: '#fac7cc',
          200: '#f68f9b',
          300: '#f34465',
          400: '#EC646C',
          500: '#CC2454',
          600: '#be2245',
          700: '#81142C',
          800: '#490715',
          900: '#241217',
        },
        // Secondary - Green from custom palette
        secondary: {
          DEFAULT: '#B0D19A',
          light: '#c8e8b5',
          dark: '#6f9c5a',
          darker: '#4d5d42',
          50: '#eef6e8',
          100: '#d5e8c8',
          200: '#B0D19A',
          300: '#8dba73',
          400: '#6f9c5a',
          500: '#4d5d42',
          600: '#303a29',
          700: '#151b11',
          800: '#0a0d08',
          900: '#050604',
        },
        // Error color for dark theme
        error: {
          DEFAULT: '#CF6679',
          dark: '#B00020',
        },
        // On colors (text/icons on surfaces)
        'on-surface': {
          DEFAULT: 'rgba(255, 255, 255, 0.87)',  // High emphasis
          medium: 'rgba(255, 255, 255, 0.60)',   // Medium emphasis
          disabled: 'rgba(255, 255, 255, 0.38)', // Disabled
        },
        'on-primary': '#000000',
        'on-secondary': '#000000',
        'on-error': '#000000',
        // Legacy support
        refinery: {
          dark: '#131213',
          blue: '#1e1e1e',
          accent: '#CC2454',
          light: '#CF6679',
        }
      },
    },
  },
  plugins: [],
}
