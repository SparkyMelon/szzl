import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Constants from 'expo-constants';
import { Feather } from '@expo/vector-icons';
import { exportBackup, hasExistingData, importBackup, pickAndParseBackup, wipeAllData } from '../lib/backup';
import { getThemeStyles, useTheme } from '../lib/theme';

const appVersion = Constants.expoConfig?.version;

function confirmWipe(): Promise<boolean> {
  return new Promise(resolve => {
    Alert.alert(
      'Existing data found',
      "Restoring requires an empty app. This will permanently delete all current recipes and custom tags before restoring the backup — this can't be undone.",
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Wipe & Restore', style: 'destructive', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) }
    );
  });
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onRestored: () => void;
  onOpenDevMode: () => void;
}

type Busy = 'export' | 'restore' | null;

export default function SettingsModal({ visible, onClose, onRestored, onOpenDevMode }: Props) {
  const { themeName, theme, toggleTheme } = useTheme();
  const themeStyles = getThemeStyles(theme);
  const [busy, setBusy] = useState<Busy>(null);
  const [message, setMessage] = useState<string | null>(null);

  function reset(): void {
    setBusy(null);
    setMessage(null);
  }

  function handleClose(): void {
    reset();
    onClose();
  }

  async function handleExport(): Promise<void> {
    setBusy('export');
    setMessage(null);
    try {
      const result = await exportBackup();
      if (result === 'saved') {
        setMessage('Backup saved.');
      }
    } catch (err) {
      console.error('Backup export failed:', err);
      const detail = err instanceof Error ? err.message : String(err);
      setMessage(`Export failed: ${detail}`);
    } finally {
      setBusy(null);
    }
  }

  async function handleRestore(): Promise<void> {
    setBusy('restore');
    setMessage(null);
    try {
      const backup = await pickAndParseBackup();
      if (!backup) return;

      if (await hasExistingData()) {
        const proceed = await confirmWipe();
        if (!proceed) return;
        await wipeAllData();
      }

      const result = await importBackup(backup);
      setMessage(`Added ${result.imported} recipe${result.imported === 1 ? '' : 's'} from the backup.`);
      onRestored();
    } catch (err) {
      console.error('Backup restore failed:', err);
      const detail = err instanceof Error ? err.message : String(err);
      setMessage(`Restore failed: ${detail}`);
    } finally {
      setBusy(null);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={[styles.box, themeStyles.modalBox]}>
          <Text style={[styles.title, themeStyles.modalTitle]}>Settings</Text>

          <Pressable
            style={[styles.row, { borderColor: theme.border }]}
            onPress={toggleTheme}
          >
            <Feather name={themeName === 'light' ? 'moon' : 'sun'} size={20} color={theme.text} />
            <View style={styles.rowText}>
              <Text style={[styles.rowTitle, { color: theme.text }]}>
                {themeName === 'light' ? 'Dark mode' : 'Light mode'}
              </Text>
              <Text style={[styles.rowSubtitle, { color: theme.textSecondary }]}>
                Switch the app's appearance.
              </Text>
            </View>
          </Pressable>

          <Pressable
            style={[styles.row, { borderColor: theme.border }]}
            onPress={handleExport}
            disabled={busy !== null}
          >
            <Feather name="upload" size={20} color={theme.text} />
            <View style={styles.rowText}>
              <Text style={[styles.rowTitle, { color: theme.text }]}>Export backup</Text>
              <Text style={[styles.rowSubtitle, { color: theme.textSecondary }]}>
                Save all your recipes to a file you can store or share.
              </Text>
            </View>
            {busy === 'export' && <ActivityIndicator color={theme.accent} />}
          </Pressable>

          <Pressable
            style={[styles.row, { borderColor: theme.border }]}
            onPress={handleRestore}
            disabled={busy !== null}
          >
            <Feather name="download" size={20} color={theme.text} />
            <View style={styles.rowText}>
              <Text style={[styles.rowTitle, { color: theme.text }]}>Restore from backup</Text>
              <Text style={[styles.rowSubtitle, { color: theme.textSecondary }]}>
                Loads recipes from a backup file. If you already have data, you'll be asked to wipe it first.
              </Text>
            </View>
            {busy === 'restore' && <ActivityIndicator color={theme.accent} />}
          </Pressable>

          {__DEV__ && (
            <Pressable
              style={[styles.row, { borderColor: theme.border }]}
              onPress={() => {
                handleClose();
                onOpenDevMode();
              }}
            >
              <Feather name="settings" size={20} color={theme.text} />
              <View style={styles.rowText}>
                <Text style={[styles.rowTitle, { color: theme.text }]}>Dev mode</Text>
              </View>
            </Pressable>
          )}

          {message && (
            <Text style={[styles.message, { color: theme.textSecondary }]}>{message}</Text>
          )}

          <Pressable
            style={[styles.doneButton, themeStyles.modalButtonCancel]}
            onPress={handleClose}
          >
            <Text style={[styles.doneButtonText, themeStyles.modalButtonCancelText]}>Done</Text>
          </Pressable>

          {appVersion && (
            <Text style={[styles.versionText, { color: theme.textSecondary }]}>
              Sizzle v{appVersion} · Beta
            </Text>
          )}
        </View>
      </View>
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
    padding: 24,
    width: '100%',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  rowSubtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  message: {
    fontSize: 13,
    marginTop: 12,
    lineHeight: 18,
  },
  doneButton: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  doneButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  versionText: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 14,
    opacity: 0.6,
  },
});
