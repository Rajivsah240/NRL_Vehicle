/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Modern Dark Theme - Deep Blue based
        surface: {
          DEFAULT: '#0A0F1E',   // Deep navy
          '1dp': '#111827',     // Slightly lighter
          '2dp': '#1A2332',
          '3dp': '#1F2937',     // Card backgrounds
          '4dp': '#243044',
          '6dp': '#2D3A50',     // Elevated surfaces
          '8dp': '#374357',
          '12dp': '#4B5563',    // Borders
          '16dp': '#6B7280',
          '24dp': '#9CA3AF',    // Subtle text
        },
        background: '#0A0F1E',
        // Primary - Vibrant Blue
        primary: {
          DEFAULT: '#3B82F6',    // Blue 500 - Vibrant
          light: '#60A5FA',      // Blue 400
          lighter: '#93C5FD',    // Blue 300
          dark: '#2563EB',       // Blue 600
          darker: '#1D4ED8',     // Blue 700
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },
        // Secondary - Vibrant Violet/Purple
        secondary: {
          DEFAULT: '#8B5CF6',    // Violet 500
          light: '#A78BFA',      // Violet 400
          dark: '#7C3AED',       // Violet 600
          darker: '#6D28D9',
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#6D28D9',
          800: '#5B21B6',
          900: '#4C1D95',
        },
        // Accent - Electric Sky Blue
        accent: {
          DEFAULT: '#0EA5E9',    // Sky 500
          light: '#38BDF8',      // Sky 400
          dark: '#0284C7',       // Sky 600
        },
        // Error color - Red
        error: {
          DEFAULT: '#EF4444',    // Red 500
          light: '#F87171',
          dark: '#DC2626',
        },
        // Success - Emerald
        success: {
          DEFAULT: '#10B981',    // Emerald 500
          light: '#34D399',
          dark: '#059669',
        },
        // Warning - Amber
        warning: {
          DEFAULT: '#F59E0B',
          light: '#FBBF24',
          dark: '#D97706',
        },
        // On colors (text/icons on surfaces)
        'on-surface': {
          DEFAULT: 'rgba(255, 255, 255, 0.95)',  // High emphasis
          medium: 'rgba(255, 255, 255, 0.75)',   // Medium emphasis
          disabled: 'rgba(255, 255, 255, 0.50)', // Disabled
        },
        'on-primary': '#FFFFFF',
        'on-secondary': '#FFFFFF',
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
