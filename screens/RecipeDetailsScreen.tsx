import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { getRecipeById } from '../repositories/recipeRepository';
import type { Recipe } from '../models';

const HERO_HEIGHT = 280;
const HEADER_HEIGHT = 60;

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

type Tab = 'ingredients' | 'steps' | 'info';

interface Props {
  recipeId: number;
  onBack: () => void;
  onEdit: (id: number) => void;
}

// ── Ingredients Tab ───────────────────────────────────────────────

function IngredientsTab({ recipe }: { recipe: Recipe }) {
  if (!recipe.ingredients?.length) {
    return <Text style={styles.emptyTab}>No ingredients added yet</Text>;
  }

  return (
    <View style={styles.tabContent}>
      {recipe.ingredients.map((ing, i) => (
        <View key={ing.id} style={[styles.ingredientRow, i % 2 === 0 && styles.ingredientRowAlt]}>
          <Text style={styles.ingredientName}>{ing.name}</Text>
          <Text style={styles.ingredientAmount}>
            {ing.quantity}{ing.unit ? ` ${ing.unit}` : ''}
          </Text>
        </View>
      ))}
    </View>
  );
}

// ── Steps Tab ─────────────────────────────────────────────────────

function StepsTab({ recipe }: { recipe: Recipe }) {
  if (!recipe.steps?.length) {
    return <Text style={styles.emptyTab}>No steps added yet</Text>;
  }

  return (
    <View style={styles.tabContent}>
      {recipe.steps.map((step, i) => (
        <View key={step.id} style={styles.stepRow}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>{i + 1}</Text>
          </View>
          <Text style={styles.stepInstruction}>{step.instruction}</Text>
        </View>
      ))}
    </View>
  );
}

// ── Info Tab ──────────────────────────────────────────────────────

function InfoTab({ recipe }: { recipe: Recipe }) {
  return (
    <View style={styles.tabContent}>

      {/* Stats row */}
      <View style={styles.statsRow}>
        {recipe.prepTime != null && (
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{recipe.prepTime}m</Text>
            <Text style={styles.statLabel}>Prep</Text>
          </View>
        )}
        {recipe.cookTime != null && (
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{recipe.cookTime}m</Text>
            <Text style={styles.statLabel}>Cook</Text>
          </View>
        )}
        {recipe.prepTime != null && recipe.cookTime != null && (
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{recipe.prepTime + recipe.cookTime}m</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        )}
        {recipe.servings != null && (
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{recipe.servings}</Text>
            <Text style={styles.statLabel}>Servings</Text>
          </View>
        )}
      </View>

      {/* Effort */}
      {recipe.effort && (
        <View style={styles.infoSection}>
          <Text style={styles.infoSectionTitle}>Effort</Text>
          <View style={[styles.effortBadge, { backgroundColor: EFFORT_COLOURS[recipe.effort] + '22' }]}>
            <Text style={[styles.effortText, { color: EFFORT_COLOURS[recipe.effort] }]}>
              {EFFORT_LABELS[recipe.effort]}
            </Text>
          </View>
        </View>
      )}

      {/* Tags */}
      {recipe.tags && recipe.tags.length > 0 && (
        <View style={styles.infoSection}>
          <Text style={styles.infoSectionTitle}>Tags</Text>
          <View style={styles.tagsWrap}>
            {recipe.tags.map(tag => (
              <View key={tag.id} style={styles.tag}>
                <Text style={styles.tagText}>{tag.name}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────

export default function RecipeDetailScreen({ recipeId, onBack, onEdit }: Props) {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('ingredients');
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    getRecipeById(recipeId)
      .then(setRecipe)
      .finally(() => setLoading(false));
  }, [recipeId]);

  // Hero fades and shrinks as you scroll
  const heroOpacity = scrollY.interpolate({
    inputRange: [0, HERO_HEIGHT / 2],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const heroScale = scrollY.interpolate({
    inputRange: [-100, 0],
    outputRange: [1.1, 1],
    extrapolate: 'clamp',
  });

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!recipe) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyTab}>Recipe not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* Hero image */}
      <Animated.View style={[styles.hero, { opacity: heroOpacity, transform: [{ scale: heroScale }] }]}>
        {recipe.imageUri ? (
          <Image source={{ uri: recipe.imageUri }} style={styles.heroImage} />
        ) : (
          <View style={styles.heroPlaceholder}>
            <Text style={styles.heroPlaceholderText}>🍽</Text>
          </View>
        )}
      </Animated.View>

      {/* Floating header */}
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.headerButton}>
          <Text style={styles.headerButtonText}>←</Text>
        </Pressable>
        <Pressable onPress={() => onEdit(recipe.id)} style={styles.headerButton}>
          <Text style={styles.headerButtonText}>Edit</Text>
        </Pressable>
      </View>

      {/* Scrollable content */}
      <Animated.ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* Spacer to push content below hero */}
        <View style={{ height: HERO_HEIGHT - 32 }} />

        {/* Content card */}
        <View style={styles.card}>

          {/* Title & description */}
          <Text style={styles.title}>{recipe.title}</Text>
          {recipe.description && (
            <Text style={styles.description}>{recipe.description}</Text>
          )}

          {/* Tabs */}
          <View style={styles.tabs}>
            {(['ingredients', 'steps', 'info'] as Tab[]).map(tab => (
              <Pressable
                key={tab}
                style={[styles.tab, activeTab === tab && styles.tabActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Tab content */}
          {activeTab === 'ingredients' && <IngredientsTab recipe={recipe} />}
          {activeTab === 'steps' && <StepsTab recipe={recipe} />}
          {activeTab === 'info' && <InfoTab recipe={recipe} />}

        </View>
      </Animated.ScrollView>

    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Hero
  hero: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HERO_HEIGHT,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e8e8e8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroPlaceholderText: {
    fontSize: 64,
  },

  // Header
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  headerButton: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  headerButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },

  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // Content card
  card: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 500,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
    marginBottom: 16,
  },

  // Tabs
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#111',
    fontWeight: '600',
  },

  // Tab content
  tabContent: {
    gap: 8,
  },
  emptyTab: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 24,
  },

  // Ingredients
  ingredientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  ingredientRowAlt: {
    backgroundColor: '#f8f8f8',
  },
  ingredientName: {
    fontSize: 14,
    color: '#111',
    flex: 1,
  },
  ingredientAmount: {
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
  },

  // Steps
  stepRow: {
    flexDirection: 'row',
    gap: 14,
    paddingVertical: 8,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    flexShrink: 0,
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  stepInstruction: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
  },

  // Info tab
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },
  statLabel: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  infoSection: {
    marginBottom: 16,
  },
  infoSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  effortBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  effortText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tagText: {
    fontSize: 13,
    color: '#555',
  },
});