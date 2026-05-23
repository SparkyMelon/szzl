import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAllRecipes, searchRecipes } from '../repositories/recipeRepository';
import { getAllTags } from '../repositories/tagRepository';
import { getAllCategories } from '../repositories/categoryRepository';
import type { Category, Recipe, Tag } from '../models';
import SpeedDial from '../components/SpeedDial';
import { EFFORT_COLOURS, EFFORT_LABELS, getThemeStyles, useTheme } from '../lib/theme';

// ── Star Rating Display ───────────────────────────────────────────

function StarRating({ rating, size = 10 }: { rating: number; size?: number }) {
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map(i => (
        <Text key={i} style={[styles.starIcon, { fontSize: size, color: i <= rating ? '#f5a623' : '#ddd' }]}>
          ★
        </Text>
      ))}
    </View>
  );
}

// ── Recipe Card ───────────────────────────────────────────────────

function RecipeCard({ recipe, onPress, themeStyles }: { recipe: Recipe; onPress: () => void; themeStyles: Record<string, any> }) {
  const isFav = recipe.isFavourite === 1;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, themeStyles.card, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      <View style={styles.cardImage}>
        {recipe.imageUri ? (
          <Image source={{ uri: recipe.imageUri }} style={styles.image} />
        ) : (
          <View style={[styles.imagePlaceholder, themeStyles.imagePlaceholder]}>
            <Text style={styles.imagePlaceholderText}>🍽</Text>
          </View>
        )}
        {isFav && (
          <Ionicons
            name="star"
            size={16}
            color="#f5a623"
            style={styles.favIcon}
          />
        )}
      </View>
      <View style={styles.cardContent}>
        <Text style={[styles.cardTitle, themeStyles.cardTitle]} numberOfLines={2}>{recipe.title}</Text>
        {recipe.effort && (
          <View style={[styles.effortBadge, { backgroundColor: EFFORT_COLOURS[recipe.effort] + '22' }]}>
            <Text style={[styles.effortText, { color: EFFORT_COLOURS[recipe.effort] }]}>
              {EFFORT_LABELS[recipe.effort]}
            </Text>
          </View>
        )}
        {recipe.rating != null && (
          <StarRating rating={recipe.rating} size={10} />
        )}
        {recipe.categories && recipe.categories.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagRow}>
            {recipe.categories.map(cat => (
              <View key={cat.id} style={[styles.tag, themeStyles.tag]}>
                <Text style={[styles.tagText, themeStyles.tagText]}>{cat.name}</Text>
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
  const { themeName, theme, toggleTheme } = useTheme();

  const searchPanelHeight = useRef(new Animated.Value(0)).current;
  const searchInputRef = useRef<TextInput>(null);
  const insets = useSafeAreaInsets();
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    getAllTags().then(setTags);
    getAllCategories().then(setCategories);
  }, []);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
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

  const themeStyles = getThemeStyles(theme);

  const isFiltering = selectedCategoryIds.length > 0 || selectedTagIds.length > 0 || query.trim().length > 0;

  return (
    <View style={[styles.container, themeStyles.container]}>

      {/* ── Category strip ── */}
      <View style={[styles.categoryBar, themeStyles.categoryBar]}>
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
                style={[styles.categoryChip, themeStyles.categoryChip, active && styles.categoryChipActive, active && themeStyles.categoryChipActive]}
              >
                <Text style={[styles.categoryChipText, themeStyles.categoryChipText, active && styles.categoryChipTextActive, active && themeStyles.categoryChipTextActive]}>
                  {cat.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Search bar ── */}
      <View style={[styles.searchRow, themeStyles.searchRow]}>
        {searchOpen ? (
          <View style={styles.searchInputRow}>
            <TextInput
              ref={searchInputRef}
              style={[styles.searchInput, themeStyles.searchInput]}
              placeholder="Search recipes..."
              placeholderTextColor={theme.placeholderText}
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
            />
            <Pressable onPress={closeSearch} style={styles.searchCancelButton}>
              <Text style={[styles.searchCancelText, themeStyles.searchCancelText]}>Cancel</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable style={[styles.searchPlaceholder, themeStyles.searchPlaceholder]} onPress={openSearch}>
            <Text style={[styles.searchPlaceholderIcon, themeStyles.searchPlaceholderIcon]}>⌕</Text>
            <Text style={[styles.searchPlaceholderText, themeStyles.searchPlaceholderText]}>
              {isFiltering ? 'Filtering…' : 'Search recipes…'}
            </Text>
          </Pressable>
        )}
      </View>

      {/* ── Tag panel (visible when search open) ── */}
      <Animated.View style={[styles.tagPanel, themeStyles.tagPanel, { maxHeight: tagPanelMaxHeight, opacity: tagPanelOpacity }]}>
        <Text style={[styles.tagPanelLabel, themeStyles.tagPanelLabel]}>Filter by tag</Text>
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
                style={[styles.tagChip, themeStyles.tagChip, active && styles.tagChipActive, active && themeStyles.tagChipActive]}
              >
                <Text style={[styles.tagChipText, themeStyles.tagChipText, active && styles.tagChipTextActive, active && themeStyles.tagChipTextActive]}>
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
          <Text style={[styles.emptyText, themeStyles.emptyText]}>No recipes found</Text>
        </View>
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={item => String(item.id)}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={[styles.grid, { paddingBottom: insets.bottom + 24 + keyboardHeight }]}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <RecipeCard recipe={item} onPress={() => onSelectRecipe(item.id)} themeStyles={themeStyles} />
          )}
        />
      )}

      <SpeedDial
        actions={[
          {
            label: themeName === 'light' ? 'Dark mode' : 'Light mode',
            icon: themeName === 'light' ? 'moon' : 'sunny',
            onPress: toggleTheme,
          },
          { label: 'New recipe', icon: 'add', onPress: onCreateRecipe },
          ...(__DEV__ ? [{ label: 'Dev mode', icon: 'settings-outline' as const, onPress: onOpenDevMode }] : []),
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
  favIcon: {
    position: 'absolute',
    top: 6,
    right: 6,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  cardContent: {
    padding: 10,
    gap: 5,
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
  starRow: {
    flexDirection: 'row',
    gap: 1,
  },
  starIcon: {
    lineHeight: 14,
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