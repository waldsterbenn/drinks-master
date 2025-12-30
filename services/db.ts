import { AppState, Recipe, UserSettings, InventoryItem, ShoppingItem, BarItem, DEFAULT_GLASSWARE } from '../types';

const DB_KEY = 'mixmaster_db_v1';

const DEFAULT_FRUIT_YIELDS: Record<string, number> = {
    'Lime': 30,
    'Lemon': 45,
    'Orange': 90,
    'Grapefruit': 150,
    'Pineapple': 500,
    'Watermelon': 1000
};

const DEFAULT_BAR_INVENTORY: BarItem[] = [
    { name: 'London Dry Gin', volumePrUnitMl: 700, categories: ['Spirit', 'Gin', 'Clear'], inStock: true },
    { name: 'Light Rum', volumePrUnitMl: 700, categories: ['Spirit', 'Rum'], inStock: true },
    { name: 'Dark Rum', volumePrUnitMl: 700, categories: ['Spirit', 'Rum', 'Aged'], inStock: true },
    { name: 'Lime', volumePrUnitMl: 1, categories: ['Fruit', 'Citrus', 'Juice'], inStock: true },
    { name: 'Lemon', volumePrUnitMl: 1, categories: ['Fruit', 'Citrus', 'Juice'], inStock: true },
    { name: 'Simple Syrup', volumePrUnitMl: 500, categories: ['Syrup', 'Sweetener'], inStock: true },
    { name: 'Angostura Bitters', volumePrUnitMl: 200, categories: ['Bitters'], inStock: true },
    { name: 'Orange Juice', volumePrUnitMl: 1000, categories: ['Juice', 'Mixer', 'Fruit'], inStock: false },
    { name: 'Campari', volumePrUnitMl: 700, categories: ['Liqueur', 'Amaro'], inStock: false },
    { name: 'Sweet Vermouth', volumePrUnitMl: 750, categories: ['Wine', 'Fortified'], inStock: false },
];

const DEFAULT_STATE: AppState = {
  recipes: [],
  settings: {
    defaultServings: 1,
    preferedUnit: 'ml',
    ingredientNotes: {},
    theme: 'default',
    fruitYields: DEFAULT_FRUIT_YIELDS
  },
  inventory: DEFAULT_GLASSWARE,
  barInventory: DEFAULT_BAR_INVENTORY,
  tempBarInventory: [],
  isTempInventoryActive: false,
  partyList: [],
  customShoppingList: []
};

// Seed data if empty
const SEED_RECIPES: Recipe[] = [
    {
        id: 'seed-1',
        title: "Don's Own Grog",
        ingredients: [
            { amount: 22.5, unit: 'ml', name: 'Lime juice', originalText: '22.5 ml Lime juice' },
            { amount: 7.5, unit: 'ml', name: 'Demerara syrup, 2:1', originalText: '7.5 ml Demerara syrup' },
            { amount: 1, unit: 'dash', name: 'Grenadine', originalText: '1 dash Grenadine' },
            { amount: 15, unit: 'ml', name: 'Creme de mure', originalText: '15 ml Creme de mure' },
            { amount: 30, unit: 'ml', name: 'Dark rum', originalText: '30 ml Dark rum' },
            { amount: 15, unit: 'ml', name: 'Light rum', originalText: '15 ml Light rum' },
            { amount: 15, unit: 'ml', name: 'Black rum', originalText: '15 ml Black rum' },
            { amount: 1, unit: 'dash', name: 'Angostura bitters', originalText: '1 dash Angostura bitters' }
        ],
        instructions: "Add all the ingredients to a drink mixer tin. Fill with 12 oz crushed ice and 4 to 6 'agitator' cubes. Flash blend and open pour with gated finish into a double old-fashioned glass. Top with freshly grated nutmeg.",
        garnish: "Grated Nutmeg",
        tags: ["cocktail-fresh", "smugglers-cove", "cocktail-blended", "cocktail-tiki", "don-the-beachcomber"],
        credits: "Originally from Don the Beachcomber, circa 1937",
        glassware: "Old Fashioned",
        addedAt: Date.now(),
        rating: 5,
        isFavorite: true,
        userNotes: ""
    },
    {
        id: 'seed-2',
        title: "Sidewinder's Fang",
        ingredients: [
            { amount: 30, unit: 'ml', name: 'Lime juice', originalText: '30 ml Lime juice' },
            { amount: 30, unit: 'ml', name: 'Orange juice', originalText: '30 ml Orange juice' },
            { amount: 30, unit: 'ml', name: 'Passion fruit syrup', originalText: '30 ml Passion fruit syrup' },
            { amount: 90, unit: 'ml', name: 'Seltzer', originalText: '90 ml Seltzer' },
            { amount: 30, unit: 'ml', name: 'Dark Jamaican rum', originalText: '30 ml Dark Jamaican rum' },
            { amount: 30, unit: 'ml', name: 'Demerara rum', originalText: '30 ml Demerara rum' }
        ],
        instructions: "Add all ingredients (except seltzer) to a drink mixer tin. Flash blend with crushed ice. Pour into a large snifter. Top with seltzer and more ice.",
        garnish: "Orange peel snake",
        tags: ["cocktail-tiki", "rum", "fruity", "classic"],
        credits: "The Lanai Restaurant, 1960s",
        glassware: "Snifter",
        addedAt: Date.now(),
        rating: 4,
        isFavorite: false,
        userNotes: ""
    },
    {
        id: 'seed-3',
        title: "Saturn",
        ingredients: [
            { amount: 37.5, unit: 'ml', name: 'Gin', originalText: '37.5 ml Gin' },
            { amount: 22.5, unit: 'ml', name: 'Lemon juice', originalText: '22.5 ml Lemon juice' },
            { amount: 15, unit: 'ml', name: 'Passion fruit syrup', originalText: '15 ml Passion fruit syrup' },
            { amount: 7.5, unit: 'ml', name: 'Orgeat', originalText: '7.5 ml Orgeat' },
            { amount: 7.5, unit: 'ml', name: 'Falernum', originalText: '7.5 ml Falernum' }
        ],
        instructions: "Flash blend with crushed ice. Pour unstrained into a coupe or tiki mug.",
        garnish: "Lemon peel ring with cherry (Saturn)",
        tags: ["cocktail-tiki", "gin", "classic", "blended"],
        credits: "J. 'Popo' Galsini, 1967",
        glassware: "Coupe",
        addedAt: Date.now(),
        rating: 3,
        isFavorite: false,
        userNotes: ""
    }
];

export const getDB = (): AppState => {
  const data = localStorage.getItem(DB_KEY);
  if (!data) {
    const initialState = { ...DEFAULT_STATE, recipes: SEED_RECIPES };
    saveDB(initialState);
    return initialState;
  }
  const parsed = JSON.parse(data);
  
  // Migrations for existing users
  if (!parsed.settings.fruitYields) {
      parsed.settings.fruitYields = DEFAULT_FRUIT_YIELDS;
      parsed.settings.theme = 'default';
  }
  if (!parsed.customShoppingList) {
      parsed.customShoppingList = [];
  }
  
  // Migration: Bar Inventory
  if (!parsed.barInventory) {
      parsed.barInventory = DEFAULT_BAR_INVENTORY;
      parsed.tempBarInventory = [];
      parsed.isTempInventoryActive = false;
  }
  
  return parsed;
};

export const saveDB = (state: AppState) => {
  localStorage.setItem(DB_KEY, JSON.stringify(state));
  window.dispatchEvent(new Event('db-change'));
};

export const addRecipes = (newRecipes: Recipe[]) => {
  const state = getDB();
  state.recipes = [...state.recipes, ...newRecipes];
  saveDB(state);
  return state.recipes;
};

export const updateRecipe = (updatedRecipe: Recipe) => {
    const state = getDB();
    state.recipes = state.recipes.map(r => r.id === updatedRecipe.id ? updatedRecipe : r);
    saveDB(state);
};

export const updateSettings = (settings: UserSettings) => {
    const state = getDB();
    state.settings = settings;
    saveDB(state);
}

export const updateInventory = (inventory: InventoryItem[]) => {
    const state = getDB();
    state.inventory = inventory;
    saveDB(state);
}

// New: Update Bar Inventory (Main or Temp)
export const updateBarInventory = (items: BarItem[], isTemp: boolean) => {
    const state = getDB();
    if (isTemp) {
        state.tempBarInventory = items;
    } else {
        state.barInventory = items;
    }
    saveDB(state);
}

// New: Toggle Temp Inventory
export const setTempInventoryActive = (isActive: boolean) => {
    const state = getDB();
    state.isTempInventoryActive = isActive;
    saveDB(state);
}

export const addToParty = (recipeId: string, count: number) => {
    const state = getDB();
    const existing = state.partyList.find(p => p.recipeId === recipeId);
    if (existing) {
        existing.count = count;
        if(existing.count <= 0) {
            state.partyList = state.partyList.filter(p => p.recipeId !== recipeId);
        }
    } else if (count > 0) {
        state.partyList.push({ recipeId, count });
    }
    saveDB(state);
    return state.partyList;
}

export const clearParty = () => {
    const state = getDB();
    state.partyList = [];
    saveDB(state);
}

export const updateShoppingList = (list: ShoppingItem[]) => {
    const state = getDB();
    state.customShoppingList = list;
    saveDB(state);
}