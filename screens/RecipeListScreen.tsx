import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { getAllRecipes, searchRecipes } from '../repositories/recipeRepository';
import { getAllTags } from '../repositories/tagRepository';
import { getAllCategories } from '../repositories/categoryRepository';
import type { Category, Recipe, Tag } from '../models';
import SpeedDial from '../components/SpeedDial';

const EFFORT_LABELS: Record<string, string> = {
  easy: 'Easy', medium: 'Medium', hard: 'Hard',
};
const EFFORT_COLOURS: Record<string, string> = {
  easy: '#2ecc71', medium: '#f39c12', hard: '#e74c3c',
};

// ── Recipe Card ───────────────────────────────────────────────────

function RecipeCard({ recipe, onPress }: { recipe: Recipe; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      <View style={styles.cardImage}>
        {recipe.imageUri ? (
          <Image source={{ uri: recipe.imageUri }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderText}>🍽</Text>
          </View>
        )}
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>{recipe.title}</Text>
        {recipe.effort && (
          <View style={[styles.effortBadge, { backgroundColor: EFFORT_COLOURS[recipe.effort] + '22' }]}>
            <Text style={[styles.effortText, { color: EFFORT_COLOURS[recipe.effort] }]}>
              {EFFORT_LABELS[recipe.effort]}
            </Text>
          </View>
        )}
        {recipe.categories && recipe.categories.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagRow}>
            {recipe.categories.map(cat => (
              <View key={cat.id} style={styles.tag}>
                <Text style={styles.tagText}>{cat.name}</Text>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </Pressable>
  );
}

// ── Main Screen ───────────────────────────────────────────────────

interface Props {
  onSelectRecipe: (id: number) => void;
  onCreateRecipe: () => void;
  onOpenDevMode: () => void;
}

export default function RecipeListScreen({ onSelectRecipe, onCreateRecipe, onOpenDevMode }: Props) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);

  const searchPanelHeight = useRef(new Animated.Value(0)).current;
  const searchInputRef = useRef<TextInput>(null);

  useEffect(() => {
    getAllTags().then(setTags);
    getAllCategories().then(setCategories);
  }, []);

  useEffect(() => {
    setLoading(true);
    const isFiltering = query.trim().length > 0 || selectedTagIds.length > 0 || selectedCategoryIds.length > 0;
    const fetch = isFiltering
      ? searchRecipes(query, selectedTagIds, selectedCategoryIds)
      : getAllRecipes();
    fetch.then(setRecipes).finally(() => setLoading(false));
  }, [query, selectedTagIds, selectedCategoryIds]);

  function openSearch(): void {
    setSearchOpen(true);
    Animated.timing(searchPanelHeight, {
      toValue: 1,
      duration: 220,
      useNativeDriver: false,
    }).start(() => searchInputRef.current?.focus());
  }

  function closeSearch(): void {
    searchInputRef.current?.blur();
    setQuery('');
    setSelectedTagIds([]);
    Animated.timing(searchPanelHeight, {
      toValue: 0,
      duration: 180,
      useNativeDriver: false,
    }).start(() => setSearchOpen(false));
  }

  const toggleCategory = useCallback((id: number) => {
    setSelectedCategoryIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }, []);

  const toggleTag = useCallback((id: number) => {
    setSelectedTagIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }, []);

  const tagPanelMaxHeight = searchPanelHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 200],
  });
  const tagPanelOpacity = searchPanelHeight.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  const isFiltering = selectedCategoryIds.length > 0 || selectedTagIds.length > 0 || query.trim().length > 0;

  return (
    <View style={styles.container}>

      {/* ── Category strip ── */}
      <View style={styles.categoryBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryContent}
        >
          {categories.map(cat => {
            const active = selectedCategoryIds.includes(cat.id);
            return (
              <Pressable
                key={cat.id}
                onPress={() => toggleCategory(cat.id)}
                style={[styles.categoryChip, active && styles.categoryChipActive]}
              >
                <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>
                  {cat.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Search bar ── */}
      <View style={styles.searchRow}>
        {searchOpen ? (
          <View style={styles.searchInputRow}>
            <TextInput
              ref={searchInputRef}
              style={styles.searchInput}
              placeholder="Search recipes..."
              placeholderTextColor="#999"
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
            />
            <Pressable onPress={closeSearch} style={styles.searchCancelButton}>
              <Text style={styles.searchCancelText}>Cancel</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable style={styles.searchPlaceholder} onPress={openSearch}>
            <Text style={styles.searchPlaceholderIcon}>⌕</Text>
            <Text style={styles.searchPlaceholderText}>
              {isFiltering ? 'Filtering…' : 'Search recipes…'}
            </Text>
          </Pressable>
        )}
      </View>

      {/* ── Tag panel (visible when search open) ── */}
      <Animated.View style={[styles.tagPanel, { maxHeight: tagPanelMaxHeight, opacity: tagPanelOpacity }]}>
        <Text style={styles.tagPanelLabel}>Filter by tag</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tagPanelContent}
        >
          {tags.map(tag => {
            const active = selectedTagIds.includes(tag.id);
            return (
              <Pressable
                key={tag.id}
                onPress={() => toggleTag(tag.id)}
                style={[styles.tagChip, active && styles.tagChipActive]}
              >
                <Text style={[styles.tagChipText, active && styles.tagChipTextActive]}>
                  {tag.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </Animated.View>

      {/* ── Recipe grid ── */}
      {loading ? (
        <ActivityIndicator style={styles.loader} />
      ) : recipes.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No recipes found</Text>
        </View>
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={item => String(item.id)}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.grid}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <RecipeCard recipe={item} onPress={() => onSelectRecipe(item.id)} />
          )}
        />
      )}

      <SpeedDial
        actions={[
          { label: 'New recipe', icon: 'plus', onPress: onCreateRecipe },
          ...(__DEV__ ? [{ label: 'Dev mode', icon: 'wrench' as const, onPress: onOpenDevMode }] : []),
        ]}
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },

  // Category strip
  categoryBar: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryContent: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  categoryChipActive: {
    backgroundColor: '#111',
    borderColor: '#111',
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#555',
  },
  categoryChipTextActive: {
    color: '#fff',
  },

  // Search bar
  searchRow: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  searchPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchPlaceholderIcon: {
    fontSize: 17,
    color: '#999',
  },
  searchPlaceholderText: {
    fontSize: 15,
    color: '#999',
  },
  searchInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111',
  },
  searchCancelButton: {
    paddingVertical: 4,
  },
  searchCancelText: {
    fontSize: 15,
    color: '#555',
  },

  // Tag panel
  tagPanel: {
    backgroundColor: '#fff',
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tagPanelLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#aaa',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 6,
  },
  tagPanelContent: {
    paddingHorizontal: 14,
    paddingBottom: 10,
    gap: 8,
  },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  tagChipActive: {
    backgroundColor: '#fff',
    borderColor: '#111',
  },
  tagChipText: {
    fontSize: 13,
    color: '#555',
  },
  tagChipTextActive: {
    color: '#111',
    fontWeight: '600',
  },

  // Grid
  grid: {
    padding: 12,
  },
  row: {
    gap: 12,
  },
  loader: {
    flex: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#999',
    fontSize: 15,
  },

  // Card
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.85,
  },
  cardImage: {
    width: '100%',
    aspectRatio: 1,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    fontSize: 32,
  },
  cardContent: {
    padding: 10,
    gap: 6,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
  },
  effortBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  effortText: {
    fontSize: 11,
    fontWeight: '600',
  },
  tagRow: {
    marginTop: 2,
  },
  tag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 4,
  },
  tagText: {
    fontSize: 11,
    color: '#555',
  },
});