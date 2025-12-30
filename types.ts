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
  isFavorite?: boolean; 
  tried?: boolean;      
  userNotes?: string;   
  addedAt: number;
}

export interface UserSettings {
  defaultServings: number;
  preferedUnit: 'ml' | 'oz' | 'cl';
  ingredientNotes: Record<string, string>;
  theme: 'default' | 'tropical';
  fruitYields: Record<string, number>;
}

export interface InventoryItem {
  name: string; 
  owned: boolean;
  volumeMl: number;
}

// New Bar Inventory Item
export interface BarItem {
  name: string; // Unique Identifier
  volumePrUnitMl: number;
  categories: string[];
  inStock: boolean;
}

export interface ShoppingItem {
  id: string;
  name: string;
  amount: number;
  unit: string;
  checked: boolean;
}

export interface AppState {
  recipes: Recipe[];
  settings: UserSettings;
  inventory: InventoryItem[]; // Glassware
  barInventory: BarItem[];    // New: Permanent Bar Inventory
  tempBarInventory: BarItem[]; // New: Temporary/Visiting Inventory
  isTempInventoryActive: boolean; // New: Toggle state
  partyList: { recipeId: string; count: number }[];
  customShoppingList: ShoppingItem[];
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