import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../lib/theme';

// ── SpeedDial ─────────────────────────────────────────────────────

export type SpeedDialIconType = 'plus' | 'settings' | 'sun' | 'moon' | 'archive';

export interface SpeedDialAction {
  label: string;
  icon: SpeedDialIconType;
  onPress: () => void;
}

interface Props {
  actions: SpeedDialAction[];
}

export default function SpeedDial({ actions }: Props) {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);

  function handleActionPress(action: SpeedDialAction): void {
    setOpen(false);
    action.onPress();
  }

  return (
    <View style={styles.container} pointerEvents="box-none">
      {open && (
        <View style={styles.actionsContainer}>
          {[...actions].reverse().map((action, index) => (
            <View key={index} style={styles.actionRow}>
              <Text style={[styles.actionLabel, { color: theme.text, backgroundColor: theme.surface }]}>{action.label}</Text>
              <Pressable
                style={({ pressed }) => [styles.actionButton, { backgroundColor: theme.fab }, pressed && styles.buttonPressed]}
                onPress={() => handleActionPress(action)}
              >
                <Feather name={action.icon} size={24} color={theme.fabIcon} />
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <Pressable
        style={({ pressed }) => [styles.fab, { backgroundColor: theme.fab }, pressed && styles.buttonPressed]}
        onPress={() => setOpen(prev => !prev)}
      >
        <Feather name={open ? 'x' : 'more-horizontal'} size={26} color={theme.fabIcon} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    alignItems: 'flex-end',
    zIndex: 999,
  },
  actionsContainer: {
    alignItems: 'flex-end',
    marginBottom: 12,
    gap: 10,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  actionButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  buttonPressed: {
    opacity: 0.75,
  },
});