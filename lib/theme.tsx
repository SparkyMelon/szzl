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
  background: '#F5F1EA',
  surface: '#FBF7F0',
  surfaceAlt: '#EFE8D8',
  surfaceMuted: '#E8E1D2',
  text: '#2E2A22',
  textSecondary: '#7A6F5C',
  border: '#E3DAC5',
  accent: '#C1833D',
  accentMuted: '#A66F32',
  danger: '#C0392B',
  dangerMuted: '#F3DCD6',
  fab: '#C1833D',
  fabIcon: '#FBF9F4',
  inputBackground: '#EFE8D8',
  inputBorder: '#D2C6AC',
  placeholderText: '#9C9080',
  overlay: 'rgba(30,20,10,0.5)',
};

const darkTheme: Theme = {
  name: 'dark',
  background: '#1D1B16',
  surface: '#26221B',
  surfaceAlt: '#2C271E',
  surfaceMuted: '#332C21',
  text: '#ECE6D9',
  textSecondary: '#B3A890',
  border: '#3A3226',
  accent: '#D29849',
  accentMuted: '#B98240',
  danger: '#E0796B',
  dangerMuted: '#4A2A22',
  fab: '#D29849',
  fabIcon: '#1D1B16',
  inputBackground: '#2C271E',
  inputBorder: '#423A2C',
  placeholderText: '#8C8271',
  overlay: 'rgba(0,0,0,0.55)',
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
    searchRow: { backgroundColor: theme.surface },
    searchPlaceholder: { backgroundColor: theme.surfaceMuted },
    searchPlaceholderText: { color: theme.textSecondary },
    searchInput: { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.inputBorder },
    tagPanel: { backgroundColor: theme.surface, borderBottomColor: theme.border },
    tagPanelLabel: { color: theme.textSecondary },
    tagChip: { backgroundColor: theme.surfaceMuted, borderColor: theme.surfaceMuted },
    tagChipActive: { backgroundColor: theme.surface, borderColor: theme.accent },
    tagChipText: { color: theme.textSecondary },
    tagChipTextActive: { color: theme.accent },
    emptyText: { color: theme.textSecondary },
    emptyTab: { color: theme.textSecondary },
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
  easy: '#6E8F4E',
  medium: '#C99A2E',
  hard: '#C6644C',
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
