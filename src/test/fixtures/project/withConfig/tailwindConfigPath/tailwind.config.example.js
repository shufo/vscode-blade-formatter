const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  theme: {
    screens: {
      sm: '0',
      md: '834px',
      lg: '1024px',
      xl: '1200px',
      xxl: '1440px',
      xxxl: '1900px',
      ...defaultTheme.screens,
    },
  },
};
