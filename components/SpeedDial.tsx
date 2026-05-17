import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export interface SpeedDialAction {
  label: string;
  icon: string;
  onPress: () => void;
}

interface Props {
  actions: SpeedDialAction[];
}

export default function SpeedDial({ actions }: Props) {
  const [open, setOpen] = useState(false);

  function handleActionPress(action: SpeedDialAction): void {
    setOpen(false);
    action.onPress();
  }

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Action buttons — rendered bottom-to-top so first action is nearest the FAB */}
      {open && (
        <View style={styles.actionsContainer}>
          {[...actions].reverse().map((action, index) => (
            <View key={index} style={styles.actionRow}>
              <Text style={styles.actionLabel}>{action.label}</Text>
              <Pressable
                style={({ pressed }) => [styles.actionButton, pressed && styles.buttonPressed]}
                onPress={() => handleActionPress(action)}
              >
                <Text style={styles.actionIcon}>{action.icon}</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}

      {/* Main "..." / close FAB */}
      <Pressable
        style={({ pressed }) => [styles.fab, pressed && styles.buttonPressed]}
        onPress={() => setOpen(prev => !prev)}
      >
        <Text style={styles.fabText}>{open ? '✕' : '•••'}</Text>
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
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  actionIcon: {
    fontSize: 20,
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  fabText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '700',
    letterSpacing: 1,
  },
  buttonPressed: {
    opacity: 0.75,
  },
});