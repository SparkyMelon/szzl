import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { UnitPicker } from '../components/UnitPicker';
import { createRecipe } from '../repositories/recipeRepository';
import { getAllCategories } from '../repositories/categoryRepository';
import { getAllTags } from '../repositories/tagRepository';
import { EFFORT_COLOURS, EFFORT_LABELS, getThemeStyles, useTheme } from '../lib/theme';
import type { Category, Effort, IngredientUnit, Tag } from '../models';
import { INGREDIENT_UNITS } from '../models';

interface IngredientDraft {
  key: string;
  name: string;
  quantity: string;
  unit: IngredientUnit | null;
}

interface StepDraft {
  key: string;
  instruction: string;
}

interface Props {
  onBack: () => void;
  onSave: (id: number) => void;
}

const EFFORT_OPTIONS: Effort[] = ['easy', 'medium', 'hard'];

let draftKeyCounter = 0;
function nextKey(): string {
  return String(++draftKeyCounter);
}

export default function RecipeCreateScreen({ onBack, onSave }: Props) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [effort, setEffort] = useState<Effort | null>(null);
  const [prepTime, setPrepTime] = useState('');
  const [cookTime, setCookTime] = useState('');
  const [servings, setServings] = useState('');

  const [ingredients, setIngredients] = useState<IngredientDraft[]>([]);
  const [steps, setSteps] = useState<StepDraft[]>([]);

  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme);
  const inputStyle = [styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }];
  const inputMultilineStyle = [styles.input, styles.inputMultiline, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }];

  useEffect(() => {
    Promise.all([getAllTags(), getAllCategories()]).then(([tags, categories]) => {
      setAllTags(tags);
      setAllCategories(categories);
    });
  }, []);

  function addIngredient(): void {
    setIngredients(prev => [...prev, { key: nextKey(), name: '', quantity: '', unit: null }]);
  }

  function updateIngredient<K extends keyof Omit<IngredientDraft, 'key'>>(
    key: string,
    field: K,
    value: IngredientDraft[K]
  ): void {
    setIngredients(prev => prev.map(ing => ing.key === key ? { ...ing, [field]: value } : ing));
  }

  function removeIngredient(key: string): void {
    setIngredients(prev => prev.filter(ing => ing.key !== key));
  }

  function addStep(): void {
    setSteps(prev => [...prev, { key: nextKey(), instruction: '' }]);
  }

  function updateStep(key: string, value: string): void {
    setSteps(prev => prev.map(s => s.key === key ? { ...s, instruction: value } : s));
  }

  function removeStep(key: string): void {
    setSteps(prev => prev.filter(s => s.key !== key));
  }

  function toggleTag(tagId: number): void {
    setSelectedTagIds(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  }

  function toggleCategory(categoryId: number): void {
    setSelectedCategoryIds(prev =>
      prev.includes(categoryId) ? prev.filter(id => id !== categoryId) : [...prev, categoryId]
    );
  }

  async function handleSave(): Promise<void> {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const id = await createRecipe({
        title: title.trim(),
        description: description.trim() || null,
        effort,
        prepTime: prepTime ? parseInt(prepTime, 10) : null,
        cookTime: cookTime ? parseInt(cookTime, 10) : null,
        servings: servings ? parseInt(servings, 10) : null,
        ingredients: ingredients
          .filter(ing => ing.name.trim())
          .map(ing => ({
            name: ing.name.trim(),
            quantity: ing.quantity.trim(),
            unit: ing.unit,
          })),
        steps: steps
          .filter(s => s.instruction.trim())
          .map(s => ({ instruction: s.instruction.trim() })),
        tagIds: selectedTagIds,
        categoryIds: selectedCategoryIds,
      });
      onSave(id);
    } catch {
      setError('Failed to save. Please try again.');
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, themeStyles.container]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <View style={[styles.container, themeStyles.container]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <Pressable onPress={onBack} style={styles.headerButton}>
          <Text style={[styles.headerButtonText, { color: theme.textSecondary }]}>Cancel</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>New Recipe</Text>
        <Pressable onPress={handleSave} style={styles.headerButton} disabled={saving}>
          <Text style={[styles.headerButtonText, styles.headerButtonSave, { color: theme.text }]}>
            {saving ? 'Saving…' : 'Save'}
          </Text>
        </Pressable>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, { paddingBottom: 24 }]} keyboardShouldPersistTaps="handled">

        {error && <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text>}

        <Text style={[styles.label, { color: theme.textSecondary }]}>Title *</Text>
        <TextInput
          style={inputStyle}
          value={title}
          onChangeText={setTitle}
          placeholder="Recipe name"
          placeholderTextColor={theme.placeholderText}
          autoFocus
        />

        <Text style={[styles.label, { color: theme.textSecondary }]}>Description</Text>
        <TextInput
          style={inputMultilineStyle}
          value={description}
          onChangeText={setDescription}
          placeholder="A short description…"
          placeholderTextColor={theme.placeholderText}
          multiline
          numberOfLines={3}
        />

        <Text style={[styles.label, { color: theme.textSecondary }]}>Effort</Text>
        <View style={styles.segmentRow}>
          {EFFORT_OPTIONS.map(opt => {
            const active = effort === opt;
            return (
              <Pressable
                key={opt}
                style={[
                  styles.segmentButton,
                  { backgroundColor: theme.surface, borderColor: theme.inputBorder },
                  active && { backgroundColor: EFFORT_COLOURS[opt] + '22', borderColor: EFFORT_COLOURS[opt] },
                ]}
                onPress={() => setEffort(active ? null : opt)}
              >
                <Text style={[styles.segmentText, { color: theme.textSecondary }, active && { color: EFFORT_COLOURS[opt], fontWeight: '600' }]}>
                  {EFFORT_LABELS[opt]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.rowFields}>
          <View style={styles.rowField}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Prep (min)</Text>
            <TextInput
              style={inputStyle}
              value={prepTime}
              onChangeText={setPrepTime}
              placeholder="0"
              placeholderTextColor={theme.placeholderText}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.rowField}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Cook (min)</Text>
            <TextInput
              style={inputStyle}
              value={cookTime}
              onChangeText={setCookTime}
              placeholder="0"
              placeholderTextColor={theme.placeholderText}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.rowField}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Servings</Text>
            <TextInput
              style={inputStyle}
              value={servings}
              onChangeText={setServings}
              placeholder="0"
              placeholderTextColor={theme.placeholderText}
              keyboardType="numeric"
            />
          </View>
        </View>

        {allCategories.length > 0 && (
          <>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Categories</Text>
            <View style={styles.tagsWrap}>
              {allCategories.map(category => {
                const active = selectedCategoryIds.includes(category.id);
                return (
                  <Pressable
                    key={category.id}
                    style={[styles.tagChip, { backgroundColor: theme.surface, borderColor: theme.border }, active && { backgroundColor: theme.accent, borderColor: theme.accent }]}
                    onPress={() => toggleCategory(category.id)}
                  >
                    <Text style={[styles.tagChipText, { color: theme.textSecondary }, active && { color: theme.surface }]}> 
                      {category.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        {allTags.length > 0 && (
          <>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Tags</Text>
            <View style={styles.tagsWrap}>
              {allTags.map(tag => {
                const active = selectedTagIds.includes(tag.id);
                return (
                  <Pressable
                    key={tag.id}
                    style={[styles.tagChip, { backgroundColor: theme.surface, borderColor: theme.border }, active && { backgroundColor: theme.accent, borderColor: theme.accent }]}
                    onPress={() => toggleTag(tag.id)}
                  >
                    <Text style={[styles.tagChipText, { color: theme.textSecondary }, active && { color: theme.surface }]}> 
                      {tag.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Ingredients</Text>
        {ingredients.map(ing => (
          <View key={ing.key} style={styles.ingredientRow}>
            <View style={styles.ingredientTopRow}>
              <TextInput
                style={[styles.input, styles.flex1, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
                value={ing.name}
                onChangeText={v => updateIngredient(ing.key, 'name', v)}
                placeholder="Ingredient name"
                placeholderTextColor={theme.placeholderText}
              />
              <Pressable onPress={() => removeIngredient(ing.key)} style={styles.removeButton}>
                <Text style={[styles.removeButtonText, { color: theme.textSecondary }]}>✕</Text>
              </Pressable>
            </View>
            <View style={styles.ingredientBottomRow}>
              <TextInput
                style={[styles.input, styles.quantityInput, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
                value={ing.quantity}
                onChangeText={v => updateIngredient(ing.key, 'quantity', v)}
                placeholder="Qty"
                placeholderTextColor={theme.placeholderText}
              />
              <UnitPicker
                value={ing.unit}
                onValueChange={v => updateIngredient(ing.key, 'unit', v as IngredientUnit | null)}
                theme={theme}
                style={[styles.pickerWrapper, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}
                options={[{ label: '— unit —', value: null }, ...INGREDIENT_UNITS.map(u => ({ label: u.label, value: u.value }))]}
              />
            </View>
          </View>
        ))}
        <Pressable style={[styles.addButton, { borderColor: theme.border }]} onPress={addIngredient}>
          <Text style={[styles.addButtonText, { color: theme.textSecondary }]}>+ Add ingredient</Text>
        </Pressable>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Steps</Text>
        {steps.map((step, i) => (
          <View key={step.key} style={styles.listRow}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>{i + 1}</Text>
            </View>
            <TextInput
              style={[styles.input, styles.flex1, styles.inputMultiline, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
              value={step.instruction}
              onChangeText={v => updateStep(step.key, v)}
              placeholder="Describe this step…"
              placeholderTextColor={theme.placeholderText}
              multiline
            />
            <Pressable onPress={() => removeStep(step.key)} style={styles.removeButton}>
              <Text style={[styles.removeButtonText, { color: theme.textSecondary }]}>✕</Text>
            </Pressable>
          </View>
        ))}
        <Pressable style={[styles.addButton, { borderColor: theme.border }]} onPress={addStep}>
          <Text style={[styles.addButtonText, { color: theme.textSecondary }]}>+ Add step</Text>
        </Pressable>

      </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: { fontSize: 16, fontWeight: '600', color: '#111' },
  headerButton: { paddingHorizontal: 4, paddingVertical: 4, minWidth: 60 },
  headerButtonText: { fontSize: 15, color: '#555' },
  headerButtonSave: { color: '#111', fontWeight: '600', textAlign: 'right' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 48 },
  errorText: { color: '#e74c3c', fontSize: 14, marginBottom: 12 },
  label: {
    fontSize: 13, fontWeight: '600', color: '#888',
    textTransform: 'uppercase', letterSpacing: 0.4,
    marginBottom: 6, marginTop: 16,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111', marginTop: 28, marginBottom: 10 },
  input: {
    backgroundColor: '#fff', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 15, color: '#111',
    borderWidth: 1, borderColor: '#e8e8e8',
  },
  inputMultiline: { minHeight: 80, textAlignVertical: 'top' },
  segmentRow: { flexDirection: 'row', gap: 8 },
  segmentButton: {
    flex: 1, paddingVertical: 10, alignItems: 'center',
    borderRadius: 10, borderWidth: 1, borderColor: '#e8e8e8', backgroundColor: '#fff',
  },
  segmentText: { fontSize: 14, color: '#555' },
  rowFields: { flexDirection: 'row', gap: 10 },
  rowField: { flex: 1 },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#e0e0e0',
  },
  tagChipActive: { backgroundColor: '#111', borderColor: '#111' },
  tagChipText: { fontSize: 13, color: '#555' },
  tagChipTextActive: { color: '#fff' },
  ingredientRow: { marginBottom: 10, gap: 6 },
  ingredientTopRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ingredientBottomRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: 26 },
  quantityInput: { width: 80 },
  pickerWrapper: {
    flex: 1, backgroundColor: '#fff', borderRadius: 10,
    borderWidth: 1, borderColor: '#e8e8e8', justifyContent: 'center',
  },
  picker: { color: '#111' },
  listRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 8 },
  flex1: { flex: 1 },
  removeButton: { padding: 10, marginTop: 2 },
  removeButtonText: { fontSize: 14, color: '#bbb' },
  stepNumber: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#111',
    alignItems: 'center', justifyContent: 'center', marginTop: 8, flexShrink: 0,
  },
  stepNumberText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  addButton: {
    paddingVertical: 12, alignItems: 'center', borderRadius: 10,
    borderWidth: 1, borderColor: '#e0e0e0', marginTop: 4,
  },
  addButtonText: { fontSize: 14, color: '#555' },
});