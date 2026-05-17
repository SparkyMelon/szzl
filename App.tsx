import { useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Animated, StyleSheet, Text } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { runMigrations } from './lib/migrations';
import { runSeeders } from './lib/seeders';
import DebugScreen from "./components/DebugScreen"
import RecipeListScreen from './screens/RecipeListScreen';
import RecipeDetailScreen from './screens/RecipeDetailsScreen';
import RecipeEditScreen from './screens/RecipeEditScreen';
import RecipeCreateScreen from './screens/RecipeCreateScreen';

type Screen =
  | { name: 'list' }
  | { name: 'detail'; recipeId: number }
  | { name: 'edit'; recipeId: number }
  | { name: 'create' };

export default function App() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [screen, setScreen] = useState<Screen>({ name: 'list' });
  const [debugVisible, setDebugVisible] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    runMigrations()
      .then(() => runSeeders())
      .then(() => setReady(true))
      .catch((e: unknown) => setError(String(e)))
  }, []);

  function showToast(message: string): void {
    setToast(message);
    toastOpacity.setValue(0);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(2000),
      Animated.timing(toastOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start(() => setToast(null));
  }

  if (error) return <Text>Migration failed: {error}</Text>;
  if (!ready) return <ActivityIndicator />;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        {screen.name === 'list' && (
          <RecipeListScreen
            onSelectRecipe={(id) => setScreen({ name: 'detail', recipeId: id })}
            onCreateRecipe={() => setScreen({ name: 'create' })}
            onOpenDevMode={() => setDebugVisible(true)}
          />
        )}
        {screen.name === 'detail' && (
          <RecipeDetailScreen
            recipeId={screen.recipeId}
            onBack={() => setScreen({ name: 'list' })}
            onEdit={(id) => setScreen({ name: 'edit', recipeId: id })}
            onDelete={(title) => {
              setScreen({ name: 'list' });
              showToast(`"${title}" deleted`);
            }}
          />
        )}
        {screen.name === 'edit' && (
          <RecipeEditScreen
            recipeId={screen.recipeId}
            onBack={() => setScreen({ name: 'detail', recipeId: screen.recipeId })}
            onSave={(id) => setScreen({ name: 'detail', recipeId: id })}
          />
        )}
        {screen.name === 'create' && (
          <RecipeCreateScreen
            onBack={() => setScreen({ name: 'list' })}
            onSave={(id) => setScreen({ name: 'detail', recipeId: id })}
          />
        )}
        <StatusBar style="auto" />
        {__DEV__ && (
          <DebugScreen
            visible={debugVisible}
            onClose={() => setDebugVisible(false)}
          />
        )}
        {toast && (
          <Animated.View style={[styles.toast, { opacity: toastOpacity }]}>
            <Text style={styles.toastText}>{toast}</Text>
          </Animated.View>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  toast: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: '#111',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  toastText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});