export type Effort = 'easy' | 'medium' | 'hard';

export type IngredientUnit =
  | 'tsp' | 'tbsp' | 'fl_oz' | 'cup' | 'ml' | 'l'
  | 'g' | 'kg' | 'oz' | 'lb'
  | 'unit' | 'pinch' | 'handful' | 'slice' | 'clove' | 'sprig' | 'to_taste';

export interface Recipe {
  id: number;
  title: string;
  description: string | null;
  effort: Effort | null;
  prepTime: number | null;
  cookTime: number | null;
  servings: number | null;
  imageUri: string | null;
  ingredients?: RecipeIngredient[];
  steps?: RecipeStep[];
  tags?: Tag[];
  createdAt: string;
  updatedAt: string;
}

export interface RecipeIngredient {
  id: number;
  recipeId: number;
  name: string;
  quantity: string;
  unit: IngredientUnit | null;
  sortOrder: number;
}

export interface RecipeStep {
  id: number;
  recipeId: number;
  instruction: string;
  sortOrder: number;
}

export interface Tag {
  id: number;
  name: string;
  isDefault: boolean;
}
