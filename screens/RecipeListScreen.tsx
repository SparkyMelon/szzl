import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import type { Recipe, Tag } from '../models';
import SpeedDial from '../components/SpeedDial';

const EFFORT_LABELS: Record<string, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

const EFFORT_COLOURS: Record<string, string> = {
  easy: '#2ecc71',
  medium: '#f39c12',
  hard: '#e74c3c',
};

// ── Recipe Card ───────────────────────────────────────────────────

function RecipeCard({ recipe, onPress }: { recipe: Recipe; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      {/* Image */}
      <View style={styles.cardImage}>
        {recipe.imageUri ? (
          <Image source={{ uri: recipe.imageUri }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderText}>🍽</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>{recipe.title}</Text>

        {recipe.effort && (
          <View style={[styles.effortBadge, { backgroundColor: EFFORT_COLOURS[recipe.effort] + '22' }]}>
            <Text style={[styles.effortText, { color: EFFORT_COLOURS[recipe.effort] }]}>
              {EFFORT_LABELS[recipe.effort]}
            </Text>
          </View>
        )}

        {recipe.tags && recipe.tags.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagRow}>
            {recipe.tags.map(tag => (
              <View key={tag.id} style={styles.tag}>
                <Text style={styles.tagText}>{tag.name}</Text>
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
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Load tags once
  useEffect(() => {
    getAllTags().then(setTags);
  }, []);

  // Reload recipes when search or filters change
  useEffect(() => {
    setLoading(true);
    const isFiltering = query.trim().length > 0 || selectedTagIds.length > 0;
    const fetch = isFiltering
      ? searchRecipes(query, selectedTagIds)
      : getAllRecipes();

    fetch
      .then(setRecipes)
      .finally(() => setLoading(false));
  }, [query, selectedTagIds]);

  const toggleTag = useCallback((tagId: number) => {
    setSelectedTagIds(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  }, []);

  return (
    <View style={styles.container}>

      {/* Search */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search recipes..."
          placeholderTextColor="#999"
          value={query}
          onChangeText={setQuery}
          clearButtonMode="while-editing"
        />
      </View>

      {/* Tag filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
        contentContainerStyle={styles.filterContent}
      >
        {tags.map(tag => {
          const active = selectedTagIds.includes(tag.id);
          return (
            <Pressable
              key={tag.id}
              onPress={() => toggleTag(tag.id)}
              style={[styles.filterTag, active && styles.filterTagActive]}
            >
              <Text style={[styles.filterTagText, active && styles.filterTagTextActive]}>
                {tag.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Recipe grid */}
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
          renderItem={({ item }) => (
            <RecipeCard recipe={item} onPress={() => onSelectRecipe(item.id)} />
          )}
        />
      )}

      {/* Speed dial FAB */}
      <SpeedDial
        actions={[
          {
            label: 'New recipe',
            icon: '✚',
            onPress: onCreateRecipe,
          },
          ...(__DEV__ ? [{
            label: 'Dev mode',
            icon: '🛠',
            onPress: onOpenDevMode,
          }] : []),
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
  searchRow: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  filterRow: {
    paddingBottom: 8,
    maxHeight: 44,
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterTagActive: {
    backgroundColor: '#111',
    borderColor: '#111',
  },
  filterTagText: {
    fontSize: 13,
    color: '#555',
  },
  filterTagTextActive: {
    color: '#fff',
  },
  grid: {
    padding: 12,
  },
  row: {
    gap: 12,
  },
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
});