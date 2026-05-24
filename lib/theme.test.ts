import { EFFORT_COLOURS, EFFORT_LABELS, getThemeStyles, themes } from './theme';

describe('theme utilities', () => {
  it('returns styling values that match the selected theme palette', () => {
    const lightStyles = getThemeStyles(themes.light);
    expect(lightStyles.container).toEqual({ backgroundColor: themes.light.background });
    expect(lightStyles.categoryChipActive).toEqual({
      backgroundColor: themes.light.accent,
      borderColor: themes.light.accent,
    });

    const darkStyles = getThemeStyles(themes.dark);
    expect(darkStyles.searchInput).toEqual({
      backgroundColor: themes.dark.inputBackground,
      color: themes.dark.text,
      borderColor: themes.dark.inputBorder,
    });
  });

  it('exports consistent effort labels and colours', () => {
    expect(EFFORT_LABELS.easy).toBe('Easy');
    expect(EFFORT_LABELS.medium).toBe('Medium');
    expect(EFFORT_LABELS.hard).toBe('Hard');

    expect(EFFORT_COLOURS.easy).toBe('#2ecc71');
    expect(EFFORT_COLOURS.medium).toBe('#f39c12');
    expect(EFFORT_COLOURS.hard).toBe('#e74c3c');
  });
});
