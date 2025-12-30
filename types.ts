export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
  originalText: string;
}

export interface Recipe {
  id: string;
  title: string;
  ingredients: Ingredient[];
  instructions: string;
  garnish?: string;
  tags: string[];
  credits?: string;
  glassware: string;
  rating?: number;
  addedAt: number;
}

export interface UserSettings {
  defaultServings: number;
  preferedUnit: 'ml' | 'oz' | 'cl';
  ingredientNotes: Record<string, string>; // e.g. "Lime": "40ml per fruit"
  theme: 'default' | 'tropical';
  fruitYields: Record<string, number>; // e.g. "Lime": 30
}

export interface InventoryItem {
  name: string; // e.g., "Coupe", "Highball"
  owned: boolean;
  volumeMl: number;
}

export interface AppState {
  recipes: Recipe[];
  settings: UserSettings;
  inventory: InventoryItem[];
  partyList: { recipeId: string; count: number }[];
}

export type GlassType = 'Coupe' | 'Old Fashioned' | 'Highball' | 'Tiki Mug' | 'Collins' | 'Martini' | 'Snifter' | 'Hurricane';

export const DEFAULT_GLASSWARE: InventoryItem[] = [
  { name: 'Coupe', owned: true, volumeMl: 200 },
  { name: 'Old Fashioned', owned: true, volumeMl: 300 },
  { name: 'Highball', owned: true, volumeMl: 350 },
  { name: 'Tiki Mug', owned: false, volumeMl: 450 },
  { name: 'Hurricane', owned: false, volumeMl: 450 },
  { name: 'Snifter', owned: false, volumeMl: 250 },
];
