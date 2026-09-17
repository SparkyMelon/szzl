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
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAllRecipes, searchRecipes } from '../repositories/recipeRepository';
import { getAllTags } from '../repositories/tagRepository';
import { getAllCategories } from '../repositories/categoryRepository';
import type { Category, Recipe, SortOption, Tag } from '../models';
import SpeedDial from '../components/SpeedDial';
import TagManagerModal from '../components/TagManagerModal';
import SortMenu from '../components/SortMenu';
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
          <Feather
            name="star"
            size={22}
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
  selectedCategoryIds: number[];
  onCategoryIdsChange: (ids: number[]) => void;
  selectedTagIds: number[];
  onTagIdsChange: (ids: number[]) => void;
  favouritesOnly: boolean;
  onFavouritesOnlyChange: (value: boolean) => void;
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
}

export default function RecipeListScreen({
  onSelectRecipe,
  onCreateRecipe,
  onOpenDevMode,
  selectedCategoryIds,
  onCategoryIdsChange,
  selectedTagIds,
  onTagIdsChange,
  favouritesOnly,
  onFavouritesOnlyChange,
  sort,
  onSortChange,
}: Props) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [manageTagsOpen, setManageTagsOpen] = useState(false);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const { themeName, theme, toggleTheme } = useTheme();

  const searchPanelHeight = useRef(new Animated.Value(0)).current;
  const searchInputRef = useRef<TextInput>(null);
  const insets = useSafeAreaInsets();
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    refreshTags();
    getAllCategories().then(setCategories);
  }, []);

  function refreshTags(): void {
    getAllTags().then(freshTags => {
      setTags(freshTags);
      const validIds = new Set(freshTags.map(t => t.id));
      onTagIdsChange(selectedTagIds.filter(id => validIds.has(id)));
    });
  }

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
    const isFiltering = query.trim().length > 0 || selectedTagIds.length > 0 || selectedCategoryIds.length > 0 || favouritesOnly;
    const fetch = isFiltering
      ? searchRecipes(query, selectedTagIds, selectedCategoryIds, sort, favouritesOnly)
      : getAllRecipes(sort);
    fetch.then(setRecipes).finally(() => setLoading(false));
  }, [query, selectedTagIds, selectedCategoryIds, favouritesOnly, sort]);

  function openSearch(): void {
    setSearchOpen(true);
    Animated.timing(searchPanelHeight, {
      toValue: 1,
      duration: 220,
      useNativeDriver: false,
    }).start(() => searchInputRef.current?.focus());
  }

  function closeSearch(): void {
    // "Done" only discards the in-progress text search — meal type and tag
    // selections are persistent filters, not part of the text search, so they
    // stay active until the user taps them off (or navigates away and back).
    searchInputRef.current?.blur();
    setQuery('');
    Animated.timing(searchPanelHeight, {
      toValue: 0,
      duration: 180,
      useNativeDriver: false,
    }).start(() => setSearchOpen(false));
  }

  function clearAllFilters(): void {
    setQuery('');
    onCategoryIdsChange([]);
    onTagIdsChange([]);
    onFavouritesOnlyChange(false);
  }

  const toggleCategory = useCallback((id: number) => {
    // Meal type is single-select: picking one replaces any previous selection,
    // tapping the active one clears it. Tags (below) stay multi-select.
    onCategoryIdsChange(selectedCategoryIds.length === 1 && selectedCategoryIds[0] === id ? [] : [id]);
  }, [selectedCategoryIds, onCategoryIdsChange]);

  const toggleTag = useCallback((id: number) => {
    onTagIdsChange(
      selectedTagIds.includes(id) ? selectedTagIds.filter(x => x !== id) : [...selectedTagIds, id]
    );
  }, [selectedTagIds, onTagIdsChange]);

  const panelMaxHeight = searchPanelHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 260],
  });
  const panelOpacity = searchPanelHeight.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  const themeStyles = getThemeStyles(theme);

  const isFiltering = selectedCategoryIds.length > 0 || selectedTagIds.length > 0 || favouritesOnly || query.trim().length > 0;
  const isNonDefaultSort = sort !== 'date_desc';

  const activeCategoryName = selectedCategoryIds.length === 1
    ? categories.find(c => c.id === selectedCategoryIds[0])?.name
    : undefined;
  const filterSummary = [
    activeCategoryName,
    selectedTagIds.length > 0 ? `${selectedTagIds.length} tag${selectedTagIds.length > 1 ? 's' : ''}` : null,
  ].filter(Boolean).join(', ');
  const placeholderText = filterSummary || (isFiltering ? 'Filtering…' : 'Search recipes…');

  function handleBackgroundPress(): void {
    if (searchOpen) closeSearch();
  }

  return (
    <Pressable style={[styles.container, themeStyles.container]} onPress={handleBackgroundPress}>

      {/* ── Search bar ── */}
      <View style={[styles.searchRow, themeStyles.searchRow]}>
        <View style={styles.searchRowMain}>
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
              <Pressable onPress={closeSearch} style={styles.searchCancelButton} hitSlop={8}>
                <Feather name="check" size={20} color={theme.accent} />
              </Pressable>
            </View>
          ) : (
            <Pressable style={[styles.searchPlaceholder, themeStyles.searchPlaceholder]} onPress={openSearch}>
              <Feather name="search" size={18} color={theme.textSecondary} />
              <Text style={[styles.searchPlaceholderText, themeStyles.searchPlaceholderText]} numberOfLines={1}>
                {placeholderText}
              </Text>
            </Pressable>
          )}
        </View>
        {!searchOpen && (
          <>
            <Pressable
              onPress={() => onFavouritesOnlyChange(!favouritesOnly)}
              style={[styles.sortButton, { backgroundColor: favouritesOnly ? '#f5a623' : theme.surfaceMuted }]}
            >
              <Feather name="star" size={18} color={favouritesOnly ? '#fff' : theme.textSecondary} />
            </Pressable>
            <Pressable
              onPress={() => setSortMenuOpen(true)}
              style={[styles.sortButton, { backgroundColor: isNonDefaultSort ? theme.accent : theme.surfaceMuted }]}
            >
              <Feather name="sliders" size={18} color={isNonDefaultSort ? theme.surface : theme.textSecondary} />
            </Pressable>
          </>
        )}
      </View>

      {/* ── Search panel (meal type + tags, visible when search open) ── */}
      <Animated.View style={[styles.searchPanel, themeStyles.tagPanel, { maxHeight: panelMaxHeight, opacity: panelOpacity }]}>

        {isFiltering && (
          <View style={styles.clearAllRow}>
            <Pressable onPress={clearAllFilters} style={styles.clearAllButton} hitSlop={8}>
              <Feather name="x" size={12} color={theme.textSecondary} />
              <Text style={[styles.clearAllText, { color: theme.textSecondary }]}>Clear all</Text>
            </Pressable>
          </View>
        )}

        {/* Meal type */}
        {categories.length > 0 && (
          <>
            <Text style={[styles.panelLabel, themeStyles.tagPanelLabel]}>Meal type</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.panelContent}
            >
              {categories.map(cat => {
                const active = selectedCategoryIds.includes(cat.id);
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => toggleCategory(cat.id)}
                    style={[styles.tagChip, themeStyles.tagChip, active && styles.tagChipActive, active && themeStyles.tagChipActive]}
                  >
                    <Text style={[styles.tagChipText, themeStyles.tagChipText, active && styles.tagChipTextActive, active && themeStyles.tagChipTextActive]}>
                      {cat.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </>
        )}

        {/* Filter by tag */}
        <View style={styles.panelLabelRow}>
          <Text style={[styles.panelLabel, themeStyles.tagPanelLabel]}>Filter by tag</Text>
          <Pressable onPress={() => setManageTagsOpen(true)} hitSlop={8} style={styles.manageTagsButton}>
            <Feather name="edit-2" size={13} color={theme.textSecondary} />
          </Pressable>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.panelContent, styles.panelContentLast]}
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
            icon: themeName === 'light' ? 'moon' : 'sun',
            onPress: toggleTheme,
          },
          { label: 'New recipe', icon: 'plus', onPress: onCreateRecipe },
          ...(__DEV__ ? [{ label: 'Dev mode', icon: 'settings' as const, onPress: onOpenDevMode }] : []),
        ]}
      />

      <TagManagerModal
        visible={manageTagsOpen}
        onClose={() => setManageTagsOpen(false)}
        onChange={refreshTags}
      />

      <SortMenu
        visible={sortMenuOpen}
        sort={sort}
        onSelect={onSortChange}
        onClose={() => setSortMenuOpen(false)}
      />
    </Pressable>
  );
}

// ── Styles ────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },

  // Search bar
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    backgroundColor: '#fff',
  },
  searchRowMain: {
    flex: 1,
  },
  sortButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
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
  searchPlaceholderText: {
    flex: 1,
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
    paddingHorizontal: 4,
  },

  // Search panel
  searchPanel: {
    backgroundColor: '#fff',
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  clearAllRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 14,
    paddingTop: 10,
  },
  clearAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clearAllText: {
    fontSize: 12,
    fontWeight: '600',
  },
  panelLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#aaa',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 6,
  },
  panelLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  manageTagsButton: {
    paddingRight: 14,
    paddingLeft: 4,
  },
  panelContent: {
    paddingHorizontal: 14,
    paddingBottom: 10,
    gap: 8,
  },
  panelContentLast: {
    paddingBottom: 14,
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