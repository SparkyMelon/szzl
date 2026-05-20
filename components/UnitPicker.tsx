import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import type { IngredientUnit } from '../models';
import type { Theme } from '../lib/theme';

interface UnitOption {
  label: string;
  value: IngredientUnit | null;
}

interface UnitPickerProps {
  value: IngredientUnit | null;
  onValueChange: (value: IngredientUnit | null) => void;
  theme: Theme;
  options: UnitOption[];
  placeholder?: string;
  style?: StyleProp<ViewStyle>;
}

export function UnitPicker({
  value,
  onValueChange,
  theme,
  options,
  placeholder = '— unit —',
  style,
}: UnitPickerProps) {
  const [visible, setVisible] = useState(false);
  const selectedOption = options.find(option => option.value === value);
  const selectedLabel = selectedOption?.label ?? placeholder;

  return (
    <>
      <Pressable
        style={[styles.trigger, style, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}
        onPress={() => setVisible(true)}
      >
        <Text style={[styles.triggerText, { color: value ? theme.text : theme.textSecondary }]}>
          {selectedLabel}
        </Text>
        <Text style={[styles.triggerIcon, { color: theme.textSecondary }]}>▾</Text>
      </Pressable>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <Pressable style={[styles.overlay, { backgroundColor: theme.overlay }]} onPress={() => setVisible(false)}>
          <View style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.border }]} onStartShouldSetResponder={() => true}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Choose unit</Text>
            <ScrollView contentContainerStyle={styles.modalListContent} style={styles.modalList}>
              {options.map(option => {
                const selected = option.value === value;
                return (
                  <Pressable
                    key={String(option.value)}
                    style={[
                      styles.modalItem,
                      { backgroundColor: selected ? theme.surfaceAlt : theme.surface },
                    ]}
                    onPress={() => {
                      setVisible(false);
                      onValueChange(option.value);
                    }}
                    android_ripple={{ color: theme.overlay }}
                  >
                    <Text style={[styles.modalItemText, { color: selected ? theme.accent : theme.text }]}> 
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  triggerText: {
    fontSize: 15,
    flex: 1,
    marginRight: 8,
    minWidth: 0,
  },
  triggerIcon: {
    fontSize: 16,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    padding: 16,
  },
  modalList: {
    flexGrow: 0,
  },
  modalListContent: {
    paddingBottom: 16,
  },
  modalItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  modalItemText: {
    fontSize: 15,
  },
});
