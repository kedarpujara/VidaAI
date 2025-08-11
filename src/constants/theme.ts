export const theme = {
  colors: {
    primary: '#4a90e2',
    danger: '#d9534f',
    background: '#ffffff',
    surface: '#fafafa',
    text: '#222222',
    textSecondary: '#444444',
    textMuted: '#777777',
    placeholder: '#999999',
    border: '#e6e6e6',
  },
  spacing: {
    xs: 6,
    sm: 10,
    md: 14,
    lg: 18,
    xl: 24,
    xxl: 36,
  },
  borderRadius: {
    sm: 6,
    md: 10,
    lg: 16,
  },
  typography: {
    h1: { fontSize: 24, fontWeight: '700' as const },
    h2: { fontSize: 20, fontWeight: '700' as const },
    h3: { fontSize: 18, fontWeight: '700' as const },
    body: { fontSize: 16, fontWeight: '400' as const },
    caption: { fontSize: 12, fontWeight: '400' as const },
    button: { fontSize: 16, fontWeight: '700' as const },
  },
  shadows: {
    small: {
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2
    }
  }
};