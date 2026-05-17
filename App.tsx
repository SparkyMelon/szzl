import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';
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

  useEffect(() => {
    runMigrations()
      .then(() => runSeeders())
      .then(() => setReady(true))
      .catch((e: unknown) => setError(String(e)))
  }, []);

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
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});