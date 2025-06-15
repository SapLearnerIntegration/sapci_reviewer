// src/theme.js
const theme = {
    colors: {
      primary: {
        light: '#4F46E5', // Indigo-600
        main: '#4338CA',  // Indigo-700
        dark: '#3730A3',  // Indigo-800
      },
      secondary: {
        light: '#0EA5E9', // Sky-500
        main: '#0284C7',  // Sky-600
        dark: '#0369A1',  // Sky-700
      },
      background: {
        default: '#1E293B', // Slate-800
        paper: '#111827',   // Gray-900
        light: '#1F2937',   // Gray-800
        accent: '#374151',  // Gray-700
      },
      text: {
        primary: '#F9FAFB',   // Gray-50
        secondary: '#E5E7EB', // Gray-200
        disabled: '#9CA3AF',  // Gray-400
        hint: '#6B7280',      // Gray-500
      },
      action: {
        active: '#E5E7EB',
        hover: 'rgba(255, 255, 255, 0.08)',
        selected: 'rgba(255, 255, 255, 0.16)',
        disabled: 'rgba(255, 255, 255, 0.3)',
      },
      success: {
        main: '#10B981', // Emerald-500
        dark: '#047857', // Emerald-700
        light: '#D1FAE5', // Emerald-100
      },
      error: {
        main: '#EF4444', // Red-500
        dark: '#B91C1C', // Red-700
        light: '#FEE2E2', // Red-100
      },
      warning: {
        main: '#F59E0B', // Amber-500
        dark: '#B45309', // Amber-700
        light: '#FEF3C7', // Amber-100
      },
      info: {
        main: '#3B82F6', // Blue-500
        dark: '#1D4ED8', // Blue-700
        light: '#DBEAFE', // Blue-100
      },
      divider: '#374151', // Gray-700
    },
    spacing: (factor) => `${0.25 * factor}rem`,
    typography: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      h1: {
        fontSize: '2.25rem',
        fontWeight: 700,
        lineHeight: 1.2,
      },
      h2: {
        fontSize: '1.875rem',
        fontWeight: 700,
        lineHeight: 1.2,
      },
      h3: {
        fontSize: '1.5rem',
        fontWeight: 600,
        lineHeight: 1.3,
      },
      h4: {
        fontSize: '1.25rem',
        fontWeight: 600,
        lineHeight: 1.4,
      },
      h5: {
        fontSize: '1.125rem',
        fontWeight: 500,
        lineHeight: 1.4,
      },
      h6: {
        fontSize: '1rem',
        fontWeight: 500,
        lineHeight: 1.4,
      },
      body1: {
        fontSize: '1rem',
        lineHeight: 1.5,
      },
      body2: {
        fontSize: '0.875rem',
        lineHeight: 1.5,
      },
      caption: {
        fontSize: '0.75rem',
        lineHeight: 1.5,
      },
      button: {
        fontSize: '0.875rem',
        fontWeight: 500,
        lineHeight: 1.75,
        textTransform: 'none',
      },
    },
    shadows: {
      small: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      medium: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      large: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    },
    roundness: {
      small: '0.25rem',
      medium: '0.375rem',
      large: '0.5rem',
      full: '9999px',
    },
    transitions: {
      fast: '150ms',
      normal: '300ms',
      slow: '450ms',
    },
  };
  
  export default theme;