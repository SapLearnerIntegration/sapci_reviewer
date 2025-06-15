// src/styleUtils.js
import theme from './theme';

// Helper for creating component styles
export const createStyles = (styleObj) => {
  return styleObj;
};

// Helper for merging styles
export const mergeStyles = (...styles) => {
  return Object.assign({}, ...styles);
};

// Common component styles
export const commonStyles = {
  card: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.roundness.medium,
    boxShadow: theme.shadows.medium,
    padding: theme.spacing(4),
    border: `1px solid ${theme.colors.divider}`,
  },
  button: {
    primary: {
      backgroundColor: theme.colors.primary.main,
      color: 'white',
      border: 'none',
      borderRadius: theme.roundness.medium,
      padding: `${theme.spacing(2)} ${theme.spacing(4)}`,
      fontWeight: 500,
      cursor: 'pointer',
      transition: `background-color ${theme.transitions.fast} ease`,
      '&:hover': {
        backgroundColor: theme.colors.primary.dark,
      },
      '&:disabled': {
        backgroundColor: theme.colors.action.disabled,
        cursor: 'not-allowed',
      },
    },
    secondary: {
      backgroundColor: 'transparent',
      color: theme.colors.text.primary,
      border: `1px solid ${theme.colors.divider}`,
      borderRadius: theme.roundness.medium,
      padding: `${theme.spacing(2)} ${theme.spacing(4)}`,
      fontWeight: 500,
      cursor: 'pointer',
      transition: `background-color ${theme.transitions.fast} ease`,
      '&:hover': {
        backgroundColor: theme.colors.action.hover,
      },
    },
  },
  input: {
    backgroundColor: theme.colors.background.light,
    border: `1px solid ${theme.colors.divider}`,
    borderRadius: theme.roundness.medium,
    padding: theme.spacing(2),
    color: theme.colors.text.primary,
    width: '100%',
    '&:focus': {
      borderColor: theme.colors.primary.main,
      outline: 'none',
    },
  },
  icon: {
    color: theme.colors.text.secondary,
    fontSize: '1.25rem',
  },
};

// Apply styles to element
export const applyStyle = (element, styles) => {
  Object.keys(styles).forEach(key => {
    if (key !== '&:hover' && key !== '&:disabled' && key !== '&:focus') {
      element.style[key] = styles[key];
    }
  });
  
  return element;
};

export default {
  theme,
  createStyles,
  mergeStyles,
  commonStyles,
  applyStyle,
};