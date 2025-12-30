import React, { useState, useEffect } from 'react';
import { getDB, clearParty, addToParty } from '../services/db';
import { AppState } from '../types';

interface AggregatedItem {
    name: string;
    totalAmount: number;
    unit: string;
    originalName: string;
}

const GROCERY_KEYWORDS = [
    'lime', 'lemon', 'orange', 'grapefruit', 'pineapple', 'apple', 
    'mint', 'basil', 'rosemary', 'cucumber', 'ginger', 
    'egg', 'cream', 'milk', 'sugar', 'honey', 'syrup', 'agave', 
    'soda', 'tonic', 'cola', 'water', 'berry', 'berries', 'cherry', 'cherries'
];

const PartyPlanner: React.FC = () => {
  const [state, setState] = useState<AppState | null>(null);

  const refresh = () => setState(getDB());

  useEffect(() => {
    refresh();
    window.addEventListener('db-change', refresh);
    return () => window.removeEventListener('db-change', refresh);
  }, []);

  if (!state) return null;

  const partyRecipes = state.partyList.map(item => {
      const recipe = state.recipes.find(r => r.id === item.recipeId);
      return { ...item, recipe };
  }).filter(i => i.recipe); // filter out deleted ones

  const shoppingList: Record<string, AggregatedItem> = {};

  partyRecipes.forEach(item => {
      if(!item.recipe) return;
      const count = item.count;
      item.recipe.ingredients.forEach(ing => {
          const key = ing.name.toLowerCase();
          if (!shoppingList[key]) {
              shoppingList[key] = {
                  name: ing.name,
                  totalAmount: 0,
                  unit: ing.unit,
                  originalName: ing.name
              };
          }
          shoppingList[key].totalAmount += (ing.amount * count);
      });
  });

  const handleClear = () => {
      clearParty();
  };

  const updateCount = (recipeId: string, count: number) => {
      addToParty(recipeId, Math.max(0, count));
  };

  const isGrocery = (name: string) => {
      const lower = name.toLowerCase();
      return GROCERY_KEYWORDS.some(k => lower.includes(k));
  };

  const getFruitCount = (name: string, totalMl: number): string | null => {
      const yields = state.settings.fruitYields || {};
      const lowerName = name.toLowerCase();
      
      // Find matching fruit key
      const match = Object.keys(yields).find(key => lowerName.includes(key.toLowerCase()));
      
      if (match) {
          const yieldPerFruit = yields[match];
          if (yieldPerFruit > 0) {
              const count = Math.ceil(totalMl / yieldPerFruit);
              return `(${count} ${match}s)`;
          }
      }
      return null;
  };

  // Sort: Groceries first, then others (mostly spirits)
  const sortedItems = Object.values(shoppingList).sort((a, b) => {
      const aIsGrocery = isGrocery(a.name);
      const bIsGrocery = isGrocery(b.name);
      if (aIsGrocery && !bIsGrocery) return -1;
      if (!aIsGrocery && bIsGrocery) return 1;
      return a.name.localeCompare(b.name);
  });

  return (
    <div className="pb-24 pt-6 md:pt-24 px-4 max-w-4xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
            <h1 className="text-3xl font-bold text-white mb-2">Party Planner</h1>
            <p className="text-gray-400">Planning {partyRecipes.reduce((acc, c) => acc + c.count, 0)} cocktails</p>
        </div>
        {partyRecipes.length > 0 && (
            <button onClick={handleClear} className="text-sm text-red-400 hover:text-red-300 underline">Clear All</button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Selected Cocktails */}
        <div className="bg-bar-800 rounded-2xl p-6 border border-bar-700 order-2 md:order-1">
            <h2 className="text-xl font-bold text-white mb-4">Menu</h2>
            {partyRecipes.length === 0 ? (
                <p className="text-gray-500 italic">No cocktails selected. Go to a recipe to add it here.</p>
            ) : (
                <ul className="space-y-4">
                    {partyRecipes.map(item => (
                        <li key={item.recipeId} className="flex justify-between items-center bg-bar-900 p-3 rounded-lg">
                            <span className="font-medium text-white truncate mr-2 flex-1">{item.recipe?.title}</span>
                            <div className="flex items-center space-x-2 bg-bar-800 rounded-md p-1 border border-bar-700">
                                <button 
                                    onClick={() => updateCount(item.recipeId, item.count - 1)}
                                    className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white rounded hover:bg-bar-700"
                                >
                                    -
                                </button>
                                <span className="text-bar-accent font-bold text-sm w-4 text-center">{item.count}</span>
                                <button 
                                    onClick={() => updateCount(item.recipeId, item.count + 1)}
                                    className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white rounded hover:bg-bar-700"
                                >
                                    +
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>

        {/* Shopping List */}
        <div className="bg-bar-800 rounded-2xl p-6 border border-bar-700 order-1 md:order-2">
             <h2 className="text-xl font-bold text-white mb-4">Shopping List</h2>
             {sortedItems.length === 0 ? (
                 <p className="text-gray-500 italic">Add cocktails to see ingredients needed.</p>
             ) : (
                 <ul className="divide-y divide-bar-700">
                     {sortedItems.map((item, idx) => {
                         const fruitStr = getFruitCount(item.name, item.totalAmount);
                         return (
                            <li key={idx} className="py-3 flex justify-between items-center">
                                <span className={`text-gray-200 capitalize ${isGrocery(item.name) ? 'font-semibold text-white' : ''}`}>
                                    {item.name}
                                </span>
                                <div className="flex items-center justify-end text-right">
                                    {fruitStr && <span className="text-bar-accent mr-3 text-sm font-medium">{fruitStr}</span>}
                                    <span className="text-bar-gold font-bold font-mono whitespace-nowrap">
                                        {item.totalAmount > 0 ? item.totalAmount.toLocaleString(undefined, {maximumFractionDigits: 1}) : ''} {item.unit}
                                    </span>
                                </div>
                            </li>
                         );
                     })}
                 </ul>
             )}
        </div>

      </div>
    </div>
  );
};

export default PartyPlanner;