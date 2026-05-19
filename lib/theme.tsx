import { Appearance } from 'react-native';
import { createContext, ReactNode, useContext, useMemo, useState } from 'react';

export type ThemeName = 'light' | 'dark';

export interface Theme {
  name: ThemeName;
  background: string;
  surface: string;
  surfaceAlt: string;
  surfaceMuted: string;
  text: string;
  textSecondary: string;
  border: string;
  accent: string;
  accentMuted: string;
  danger: string;
  dangerMuted: string;
  fab: string;
  fabIcon: string;
  inputBackground: string;
  inputBorder: string;
  placeholderText: string;
  overlay: string;
}

const lightTheme: Theme = {
  name: 'light',
  background: '#f8f8f8',
  surface: '#ffffff',
  surfaceAlt: '#f0f0f0',
  surfaceMuted: '#efefef',
  text: '#111111',
  textSecondary: '#555555',
  border: '#f0f0f0',
  accent: '#111111',
  accentMuted: '#222222',
  danger: '#e74c3c',
  dangerMuted: '#f8d8d2',
  fab: '#111111',
  fabIcon: '#ffffff',
  inputBackground: '#f0f0f0',
  inputBorder: '#e0e0e0',
  placeholderText: '#999999',
  overlay: 'rgba(0,0,0,0.5)',
};

const darkTheme: Theme = {
  name: 'dark',
  background: '#111111',
  surface: '#1a1a1a',
  surfaceAlt: '#242424',
  surfaceMuted: '#2a2a2a',
  text: '#f2f2f2',
  textSecondary: '#c5c5c5',
  border: '#2a2a2a',
  accent: '#eeeeee',
  accentMuted: '#d2d2d2',
  danger: '#f06666',
  dangerMuted: '#5d2a2a',
  fab: '#eeeeee',
  fabIcon: '#111111',
  inputBackground: '#1f1f1f',
  inputBorder: '#2a2a2a',
  placeholderText: '#999999',
  overlay: 'rgba(0,0,0,0.45)',
};

export const themes: Record<ThemeName, Theme> = {
  light: lightTheme,
  dark: darkTheme,
};

export function getThemeStyles(theme: Theme) {
  return {
    container: { backgroundColor: theme.background },
    heroPlaceholder: { backgroundColor: theme.surfaceMuted },
    modalBox: { backgroundColor: theme.surface },
    modalTitle: { color: theme.text },
    modalBody: { color: theme.textSecondary },
    modalButtonCancel: { backgroundColor: theme.surfaceMuted },
    modalButtonCancelText: { color: theme.textSecondary },
    card: { backgroundColor: theme.surface },
    title: { color: theme.text },
    description: { color: theme.textSecondary },
    tabs: { backgroundColor: theme.surfaceMuted },
    tabText: { color: theme.textSecondary },
    ingredientRowAlt: { backgroundColor: theme.surfaceMuted },
    ingredientName: { color: theme.text },
    ingredientAmount: { color: theme.textSecondary },
    stepNumber: { backgroundColor: theme.text },
    stepNumberText: { color: theme.background },
    stepInstruction: { color: theme.textSecondary },
    statBox: { backgroundColor: theme.surfaceMuted },
    statValue: { color: theme.text },
    statLabel: { color: theme.textSecondary },
    infoSectionTitle: { color: theme.textSecondary },
    categoryBar: { backgroundColor: theme.surface, borderBottomColor: theme.border },
    categoryChip: { backgroundColor: theme.surfaceMuted, borderColor: theme.surfaceMuted },
    categoryChipActive: { backgroundColor: theme.accent, borderColor: theme.accent },
    categoryChipText: { color: theme.textSecondary },
    categoryChipTextActive: { color: theme.surface },
    searchRow: { backgroundColor: theme.surface },
    searchPlaceholder: { backgroundColor: theme.surfaceMuted },
    searchPlaceholderIcon: { color: theme.textSecondary },
    searchPlaceholderText: { color: theme.textSecondary },
    searchInput: { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.inputBorder },
    searchCancelText: { color: theme.accent },
    tagPanel: { backgroundColor: theme.surface, borderBottomColor: theme.border },
    tagPanelLabel: { color: theme.textSecondary },
    tagChip: { backgroundColor: theme.surfaceMuted, borderColor: theme.surfaceMuted },
    tagChipActive: { backgroundColor: theme.surface, borderColor: theme.accent },
    tagChipText: { color: theme.textSecondary },
    tagChipTextActive: { color: theme.accent },
    emptyText: { color: theme.textSecondary },
    imagePlaceholder: { backgroundColor: theme.surfaceMuted },
    cardTitle: { color: theme.text },
    tag: { backgroundColor: theme.surfaceMuted },
    tagText: { color: theme.textSecondary },
  };
}

export const EFFORT_LABELS = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
} as const;

export const EFFORT_COLOURS = {
  easy: '#2ecc71',
  medium: '#f39c12',
  hard: '#e74c3c',
} as const;

interface ThemeContextValue {
  themeName: ThemeName;
  theme: Theme;
  toggleTheme: () => void;
}

const initialThemeName = (): ThemeName => {
  const systemColorScheme = Appearance.getColorScheme();
  return systemColorScheme === 'dark' ? 'dark' : 'light';
};

const ThemeContext = createContext<ThemeContextValue>({
  themeName: 'light',
  theme: lightTheme,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeName, setThemeName] = useState<ThemeName>(initialThemeName);
  const theme = themes[themeName];

  const value = useMemo(
    () => ({
      themeName,
      theme,
      toggleTheme: () => setThemeName(prev => (prev === 'light' ? 'dark' : 'light')),
    }),
    [themeName, theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
