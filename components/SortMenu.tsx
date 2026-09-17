import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { getThemeStyles, useTheme } from '../lib/theme';
import type { SortOption } from '../models';
import { SORT_OPTIONS } from '../models';

interface Props {
  visible: boolean;
  sort: SortOption;
  onSelect: (sort: SortOption) => void;
  onClose: () => void;
}

export default function SortMenu({ visible, sort, onSelect, onClose }: Props) {
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={[styles.box, themeStyles.modalBox]}>
          <Text style={[styles.title, themeStyles.modalTitle]}>Sort by</Text>
          {SORT_OPTIONS.map(option => {
            const active = option.value === sort;
            return (
              <Pressable
                key={option.value}
                style={styles.row}
                onPress={() => {
                  onSelect(option.value);
                  onClose();
                }}
              >
                <Text style={[styles.rowText, { color: active ? theme.accent : theme.text }, active && styles.rowTextActive]}>
                  {option.label}
                </Text>
                {active && <Feather name="check" size={18} color={theme.accent} />}
              </Pressable>
            );
          })}
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  box: {
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 8,
    width: '100%',
    maxWidth: 320,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  rowText: {
    fontSize: 15,
  },
  rowTextActive: {
    fontWeight: '600',
  },
});
