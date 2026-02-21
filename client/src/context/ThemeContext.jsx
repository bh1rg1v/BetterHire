import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

const themes = {
  dark: {
    colors: {
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
    },
  },
  light: {
    colors: {
      primary: '#8B7AB8',
      primaryDark: '#6B5A98',
      primaryLight: '#B8A8D8',
      bg: '#F9FAFB',
      bgCard: '#FFFFFF',
      bgHover: '#F3F4F6',
      text: '#111827',
      textMuted: '#6B7280',
      textDim: '#9CA3AF',
      border: '#E5E7EB',
      success: '#10B981',
      warning: '#F59E0B',
      danger: '#EF4444',
      info: '#3B82F6',
    },
  },
};

const baseTheme = {
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
};

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    localStorage.setItem('theme', mode);
    document.body.style.background = themes[mode].colors.bg;
    document.body.style.color = themes[mode].colors.text;
  }, [mode]);

  const theme = { ...baseTheme, ...themes[mode], mode };

  const toggleTheme = () => setMode(m => m === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
