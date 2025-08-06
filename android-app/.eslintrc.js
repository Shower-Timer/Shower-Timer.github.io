module.exports = {
  root: true,
  extends: ['@react-native'],
  rules: {
    // Relax some rules for React Native development
    'prettier/prettier': 'off', // Disable prettier conflicts
    'no-unused-vars': 'warn',
    'no-console': 'off', // Allow console statements in React Native
    'quotes': 'off', // Allow both single and double quotes
    'comma-dangle': 'off', // Allow trailing commas
    'no-trailing-spaces': 'warn',
    'eol-last': 'warn',
    'no-dupe-keys': 'error',
    'no-shadow': 'warn',
  },
};
