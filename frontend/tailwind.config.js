/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Modern Dark Theme Colors - Slate based
        surface: {
          DEFAULT: '#0F172A',   // Slate 900
          '1dp': '#1E293B',     // Slate 800
          '2dp': '#1E293B',
          '3dp': '#334155',     // Slate 700
          '4dp': '#334155',
          '6dp': '#475569',     // Slate 600
          '8dp': '#475569',
          '12dp': '#64748B',    // Slate 500
          '16dp': '#64748B',
          '24dp': '#94A3B8',    // Slate 400
        },
        background: '#0F172A',
        // Primary - Cyan/Teal
        primary: {
          DEFAULT: '#06B6D4',    // Cyan 500
          light: '#22D3EE',      // Cyan 400
          lighter: '#67E8F9',    // Cyan 300
          dark: '#0891B2',       // Cyan 600
          darker: '#0E7490',     // Cyan 700
          50: '#ECFEFF',
          100: '#CFFAFE',
          200: '#A5F3FC',
          300: '#67E8F9',
          400: '#22D3EE',
          500: '#06B6D4',
          600: '#0891B2',
          700: '#0E7490',
          800: '#155E75',
          900: '#164E63',
        },
        // Secondary - Amber/Gold
        secondary: {
          DEFAULT: '#F59E0B',    // Amber 500
          light: '#FBBF24',      // Amber 400
          dark: '#D97706',       // Amber 600
          darker: '#B45309',
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
        // Error color - Rose
        error: {
          DEFAULT: '#F43F5E',    // Rose 500
          light: '#FB7185',
          dark: '#E11D48',
        },
        // Success - Emerald
        success: {
          DEFAULT: '#10B981',    // Emerald 500
          light: '#34D399',
          dark: '#059669',
        },
        // On colors (text/icons on surfaces)
        'on-surface': {
          DEFAULT: 'rgba(255, 255, 255, 0.92)',  // High emphasis
          medium: 'rgba(255, 255, 255, 0.70)',   // Medium emphasis
          disabled: 'rgba(255, 255, 255, 0.45)', // Disabled
        },
        'on-primary': '#000000',
        'on-secondary': '#000000',
        'on-error': '#FFFFFF',
        // Legacy support
        refinery: {
          dark: '#0F172A',
          blue: '#1E293B',
          accent: '#06B6D4',
          light: '#22D3EE',
        }
      },
    },
  },
  plugins: [],
}
