export type Effort = 'easy' | 'medium' | 'hard';

export type IngredientUnit =
  | 'tsp' | 'tbsp' | 'fl_oz' | 'cup' | 'ml' | 'l'
  | 'g' | 'kg' | 'oz' | 'lb'
  | 'unit' | 'pinch' | 'handful' | 'slice' | 'clove' | 'sprig' | 'to_taste';

export const INGREDIENT_UNITS: { value: IngredientUnit; label: string }[] = [
  { value: 'tsp',      label: 'tsp' },
  { value: 'tbsp',     label: 'tbsp' },
  { value: 'fl_oz',    label: 'fl oz' },
  { value: 'cup',      label: 'cup' },
  { value: 'ml',       label: 'ml' },
  { value: 'l',        label: 'l' },
  { value: 'g',        label: 'g' },
  { value: 'kg',       label: 'kg' },
  { value: 'oz',       label: 'oz' },
  { value: 'lb',       label: 'lb' },
  { value: 'unit',     label: 'unit' },
  { value: 'pinch',    label: 'pinch' },
  { value: 'handful',  label: 'handful' },
  { value: 'slice',    label: 'slice' },
  { value: 'clove',    label: 'clove' },
  { value: 'sprig',    label: 'sprig' },
  { value: 'to_taste', label: 'to taste' },
];

export type SortOption =
  | 'date_desc'
  | 'date_asc'
  | 'title_asc'
  | 'title_desc'
  | 'rating_desc'
  | 'rating_asc';

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'date_desc',   label: 'Newest first' },
  { value: 'date_asc',    label: 'Oldest first' },
  { value: 'title_asc',   label: 'A → Z' },
  { value: 'title_desc',  label: 'Z → A' },
  { value: 'rating_desc', label: 'Top rated' },
  { value: 'rating_asc',  label: 'Lowest rated' },
];

export interface Recipe {
  id: number;
  title: string;
  description: string | null;
  effort: Effort | null;
  prepTime: number | null;
  cookTime: number | null;
  servings: number | null;
  imageUri: string | null;
  isFavourite: number;
  rating: number | null;
  ingredients?: RecipeIngredient[];
  steps?: RecipeStep[];
  tags?: Tag[];
  categories?: Category[];
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

export interface Category {
  id: number;
  name: string;
  isDefault: boolean;
}