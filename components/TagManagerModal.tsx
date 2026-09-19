import { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { createTag, deleteTag, getAllTags, updateTag } from '../repositories/tagRepository';
import { getThemeStyles, useTheme } from '../lib/theme';
import type { Tag } from '../models';

function confirmDeleteTag(name: string): Promise<boolean> {
  return new Promise(resolve => {
    Alert.alert(
      'Delete tag?',
      `"${name}" will be removed from any recipes that use it. This can't be undone.`,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Delete', style: 'destructive', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) }
    );
  });
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onChange: () => void;
}

export default function TagManagerModal({ visible, onClose, onChange }: Props) {
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme);
  const [tags, setTags] = useState<Tag[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [newTagName, setNewTagName] = useState('');

  useEffect(() => {
    if (visible) {
      setEditingId(null);
      setNewTagName('');
      refreshTags();
    }
  }, [visible]);

  function refreshTags(): void {
    getAllTags().then(setTags);
  }

  function startEditing(tag: Tag): void {
    setEditingId(tag.id);
    setEditingName(tag.name);
  }

  async function commitEdit(): Promise<void> {
    const name = editingName.trim();
    if (editingId == null || !name) {
      setEditingId(null);
      return;
    }
    await updateTag(editingId, name);
    setEditingId(null);
    refreshTags();
    onChange();
  }

  async function handleDelete(tag: Tag): Promise<void> {
    const confirmed = await confirmDeleteTag(tag.name);
    if (!confirmed) return;
    await deleteTag(tag.id);
    refreshTags();
    onChange();
  }

  async function handleAdd(): Promise<void> {
    const name = newTagName.trim();
    if (!name) return;
    await createTag(name);
    setNewTagName('');
    refreshTags();
    onChange();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.box, themeStyles.modalBox]}>
          <Text style={[styles.title, themeStyles.modalTitle]}>Manage Tags</Text>

          <View style={styles.list}>
            {tags.map(tag => (
              <View key={tag.id} style={[styles.row, { borderColor: theme.border }]}>
                {editingId === tag.id ? (
                  <TextInput
                    style={[styles.editInput, { color: theme.text, borderColor: theme.accent }]}
                    value={editingName}
                    onChangeText={setEditingName}
                    autoFocus
                    onSubmitEditing={commitEdit}
                    returnKeyType="done"
                  />
                ) : (
                  <Text style={[styles.rowText, { color: theme.text }]} numberOfLines={1}>
                    {tag.name}
                  </Text>
                )}
                <View style={styles.rowActions}>
                  {editingId === tag.id ? (
                    <Pressable onPress={commitEdit} hitSlop={8} style={styles.rowButton}>
                      <Feather name="check" size={18} color={theme.accent} />
                    </Pressable>
                  ) : (
                    <Pressable onPress={() => startEditing(tag)} hitSlop={8} style={styles.rowButton}>
                      <Feather name="edit-2" size={16} color={theme.textSecondary} />
                    </Pressable>
                  )}
                  <Pressable onPress={() => handleDelete(tag)} hitSlop={8} style={styles.rowButton}>
                    <Feather name="trash-2" size={16} color={theme.danger} />
                  </Pressable>
                </View>
              </View>
            ))}
            {tags.length === 0 && (
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No tags yet</Text>
            )}
          </View>

          <View style={styles.addRow}>
            <TextInput
              style={[styles.addInput, { color: theme.text, backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}
              value={newTagName}
              onChangeText={setNewTagName}
              placeholder="New tag name"
              placeholderTextColor={theme.placeholderText}
              onSubmitEditing={handleAdd}
              returnKeyType="done"
            />
            <Pressable
              onPress={handleAdd}
              style={[styles.addButton, { backgroundColor: theme.accent }]}
              disabled={!newTagName.trim()}
            >
              <Feather name="plus" size={20} color={theme.surface} />
            </Pressable>
          </View>

          <Pressable
            style={[styles.doneButton, themeStyles.modalButtonCancel]}
            onPress={onClose}
          >
            <Text style={[styles.doneButtonText, themeStyles.modalButtonCancelText]}>Done</Text>
          </Pressable>
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
    maxHeight: '80%',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  list: {
    gap: 4,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 8,
  },
  rowText: {
    flex: 1,
    fontSize: 15,
  },
  editInput: {
    flex: 1,
    fontSize: 15,
    borderBottomWidth: 1,
    paddingVertical: 2,
  },
  rowActions: {
    flexDirection: 'row',
    gap: 16,
  },
  rowButton: {
    padding: 2,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 16,
  },
  addRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  addInput: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  addButton: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButton: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
