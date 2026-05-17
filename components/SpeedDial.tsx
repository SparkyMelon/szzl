import { ReactNode, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

// ── Icon components ───────────────────────────────────────────────
// All icons are drawn with Views so they're consistent, crisp, and
// always white — no emoji rendering quirks across platforms.

export function IconPlus() {
  return (
    <View style={iconStyles.container}>
      <View style={[iconStyles.bar, iconStyles.horizontal]} />
      <View style={[iconStyles.bar, iconStyles.vertical]} />
    </View>
  );
}

export function IconWrench() {
  return (
    <View style={iconStyles.container}>
      {/* Three slider lines */}
      <View style={iconStyles.sliderRow}>
        <View style={iconStyles.sliderDot} />
        <View style={iconStyles.sliderLine} />
      </View>
      <View style={[iconStyles.sliderRow, iconStyles.sliderRowMid]}>
        <View style={iconStyles.sliderLine} />
        <View style={iconStyles.sliderDot} />
      </View>
      <View style={iconStyles.sliderRow}>
        <View style={iconStyles.sliderDotSmall} />
        <View style={iconStyles.sliderLine} />
      </View>
    </View>
  );
}

export function IconClose() {
  return (
    <View style={iconStyles.container}>
      <View style={[iconStyles.bar, iconStyles.diagA]} />
      <View style={[iconStyles.bar, iconStyles.diagB]} />
    </View>
  );
}

export function IconDots() {
  return (
    <View style={iconStyles.dotsRow}>
      <View style={iconStyles.dot} />
      <View style={iconStyles.dot} />
      <View style={iconStyles.dot} />
    </View>
  );
}

const W = 22;

const iconStyles = StyleSheet.create({
  container: {
    width: W,
    height: W,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bar: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  horizontal: {
    width: W * 0.8,
    height: 2.5,
  },
  vertical: {
    width: 2.5,
    height: W * 0.8,
  },
  diagA: {
    width: W * 0.72,
    height: 2.5,
    transform: [{ rotate: '45deg' }],
  },
  diagB: {
    width: W * 0.72,
    height: 2.5,
    transform: [{ rotate: '-45deg' }],
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: W * 0.85,
    marginVertical: 1.5,
  },
  sliderRowMid: {
    flexDirection: 'row-reverse',
  },
  sliderLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#fff',
    borderRadius: 1,
  },
  sliderDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#fff',
    marginHorizontal: 3,
  },
  sliderDotSmall: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#fff',
    marginHorizontal: 3,
    opacity: 0,  // keeps spacing symmetric on the third row
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#fff',
  },
});

// ── SpeedDial ─────────────────────────────────────────────────────

export type SpeedDialIconType = 'plus' | 'wrench';

export interface SpeedDialAction {
  label: string;
  icon: SpeedDialIconType;
  onPress: () => void;
}

interface Props {
  actions: SpeedDialAction[];
}

function renderIcon(icon: SpeedDialIconType): ReactNode {
  switch (icon) {
    case 'plus':   return <IconPlus />;
    case 'wrench': return <IconWrench />;
  }
}

export default function SpeedDial({ actions }: Props) {
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
              <Text style={styles.actionLabel}>{action.label}</Text>
              <Pressable
                style={({ pressed }) => [styles.actionButton, pressed && styles.buttonPressed]}
                onPress={() => handleActionPress(action)}
              >
                {renderIcon(action.icon)}
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <Pressable
        style={({ pressed }) => [styles.fab, pressed && styles.buttonPressed]}
        onPress={() => setOpen(prev => !prev)}
      >
        {open ? <IconClose /> : <IconDots />}
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
  buttonPressed: {
    opacity: 0.75,
  },
});