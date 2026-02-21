export const getTheme = (colors) => ({
  colors,
  fonts: {
    body: "'Euclid Circular A', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    mono: "'Source Code Pro', monospace",
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    xxl: '3rem',
  },
  radius: {
    sm: '0px',
    md: '0px',
    lg: '0px',
  },
  sidebar: {
    width: '240px',
  },
});

export const theme = getTheme({
  primary: '#8B7AB8',
  primaryDark: '#6B5A98',
  primaryLight: '#B8A8D8',
  bg: '#0A0E1A',
  bgCard: '#13182B',
  bgHover: '#1A2038',
  text: '#F9FAFB',
  textMuted: '#9CA3AF',
  textDim: '#6B7280',
  border: '#2D3748',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
});
