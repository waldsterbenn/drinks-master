import React, { useState, useEffect } from 'react';
import { getDB, clearParty, addToParty, updateShoppingList } from '../services/db';
import { AppState, ShoppingItem } from '../types';
import { v4 as uuidv4 } from 'uuid'; // Actually using browser crypto in utility if uuid package fails, but prompt importmap has uuid

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

  // --- Logic for Ingredients (Calculated) ---

  const partyRecipes = state.partyList.map(item => {
      const recipe = state.recipes.find(r => r.id === item.recipeId);
      return { ...item, recipe };
  }).filter(i => i.recipe); 

  const calculatedIngredients: Record<string, AggregatedItem> = {};

  partyRecipes.forEach(item => {
      if(!item.recipe) return;
      const count = item.count;
      item.recipe.ingredients.forEach(ing => {
          const key = ing.name.toLowerCase();
          if (!calculatedIngredients[key]) {
              calculatedIngredients[key] = {
                  name: ing.name,
                  totalAmount: 0,
                  unit: ing.unit,
                  originalName: ing.name
              };
          }
          calculatedIngredients[key].totalAmount += (ing.amount * count);
      });
  });

  const isGrocery = (name: string) => {
      const lower = name.toLowerCase();
      return GROCERY_KEYWORDS.some(k => lower.includes(k));
  };

  const getFruitCount = (name: string, totalMl: number): string | null => {
      const yields = state.settings.fruitYields || {};
      const lowerName = name.toLowerCase();
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

  const sortedIngredients = Object.values(calculatedIngredients).sort((a, b) => {
      const aIsGrocery = isGrocery(a.name);
      const bIsGrocery = isGrocery(b.name);
      if (aIsGrocery && !bIsGrocery) return -1;
      if (!aIsGrocery && bIsGrocery) return 1;
      return a.name.localeCompare(b.name);
  });

  // --- Logic for Shopping List (Custom) ---

  const addToShoppingList = (ing: AggregatedItem) => {
      const newList = [...state.customShoppingList];
      // Check if similar item exists to merge
      const existingIdx = newList.findIndex(i => i.name.toLowerCase() === ing.name.toLowerCase() && i.unit === ing.unit);
      
      if (existingIdx >= 0) {
          newList[existingIdx].amount += ing.totalAmount;
          newList[existingIdx].checked = false; // Uncheck on update
      } else {
          newList.push({
              id: Math.random().toString(36).substr(2, 9),
              name: ing.name,
              amount: ing.totalAmount,
              unit: ing.unit,
              checked: false
          });
      }
      updateShoppingList(newList);
  };

  const toggleShoppingItem = (id: string) => {
      const newList = state.customShoppingList.map(i => i.id === id ? { ...i, checked: !i.checked } : i);
      updateShoppingList(newList);
  };

  const updateItemAmount = (id: string, delta: number) => {
      const newList = state.customShoppingList.map(i => {
          if (i.id === id) {
              let step = 1;
              const u = i.unit.toLowerCase();
              const isVolume = ['ml', 'cl', 'oz', 'l'].includes(u);

              if (isVolume) {
                   const yields = state.settings.fruitYields || {};
                   const lowerName = i.name.toLowerCase();
                   const fruitMatch = Object.keys(yields).find(key => lowerName.includes(key.toLowerCase()));
                   
                   if (fruitMatch) {
                       const yieldMl = yields[fruitMatch];
                       if (u === 'ml') step = yieldMl;
                       else if (u === 'cl') step = yieldMl / 10;
                       else if (u === 'oz') step = yieldMl / 29.5735;
                       else if (u === 'l') step = yieldMl / 1000;
                   } else {
                       if (u === 'ml') step = 10;
                       else if (u === 'cl') step = 1;
                       else if (u === 'oz') step = 0.5;
                       else if (u === 'l') step = 0.05;
                   }
              } else {
                  step = 1;
              }
              
              const newAmount = Math.max(0, i.amount + (delta * step));
              return { ...i, amount: parseFloat(newAmount.toFixed(2)), checked: false };
          }
          return i;
      });
      updateShoppingList(newList);
  };

  const removeShoppingItem = (id: string) => {
      const newList = state.customShoppingList.filter(i => i.id !== id);
      updateShoppingList(newList);
  };

  const updateCount = (recipeId: string, count: number) => {
      addToParty(recipeId, Math.max(0, count));
  };

  return (
    <div className="pb-24 pt-6 md:pt-24 px-4 max-w-7xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
            <h1 className="text-3xl font-bold text-white mb-2">Party Planner</h1>
            <p className="text-gray-400">Planning {partyRecipes.reduce((acc, c) => acc + c.count, 0)} cocktails</p>
        </div>
        {partyRecipes.length > 0 && (
            <button onClick={() => clearParty()} className="text-sm text-red-400 hover:text-red-300 underline">Clear Menu</button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Panel 1: Menu */}
        <div className="bg-bar-800 rounded-2xl p-6 border border-bar-700 flex flex-col h-fit">
            <h2 className="text-xl font-bold text-white mb-4 border-b border-bar-700 pb-2">Menu</h2>
            {partyRecipes.length === 0 ? (
                <p className="text-gray-500 italic">No cocktails selected.</p>
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

        {/* Panel 2: Ingredients (Calculated) */}
        <div className="bg-bar-800 rounded-2xl p-6 border border-bar-700 flex flex-col h-fit">
             <div className="mb-4 border-b border-bar-700 pb-2">
                 <h2 className="text-xl font-bold text-white">Ingredients</h2>
                 <p className="text-xs text-gray-400 mt-1">Click an item to add to your shopping list</p>
             </div>
             
             {sortedIngredients.length === 0 ? (
                 <p className="text-gray-500 italic">Add cocktails to see ingredients needed.</p>
             ) : (
                 <ul className="divide-y divide-bar-700">
                     {sortedIngredients.map((item, idx) => {
                         const fruitStr = getFruitCount(item.name, item.totalAmount);
                         return (
                            <li 
                                key={idx} 
                                onClick={() => addToShoppingList(item)}
                                className="py-3 flex justify-between items-center cursor-pointer group hover:bg-bar-900 px-2 rounded -mx-2 transition-colors"
                            >
                                <div className="flex items-center">
                                    <span className="text-bar-accent opacity-0 group-hover:opacity-100 mr-2 transition-opacity">+</span>
                                    <span className={`text-gray-200 capitalize ${isGrocery(item.name) ? 'font-semibold text-white' : ''}`}>
                                        {item.name}
                                    </span>
                                </div>
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

        {/* Panel 3: Shopping List (Custom) */}
        <div className="bg-bar-800 rounded-2xl p-6 border border-bar-700 flex flex-col h-fit">
            <div className="mb-4 border-b border-bar-700 pb-2 flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Shopping List</h2>
                {state.customShoppingList.length > 0 && (
                    <button onClick={() => updateShoppingList([])} className="text-xs text-red-400 hover:text-white">Clear</button>
                )}
            </div>
            
            {state.customShoppingList.length === 0 ? (
                <p className="text-gray-500 italic">Your list is empty. Click ingredients to add them.</p>
            ) : (
                <ul className="space-y-2">
                    {state.customShoppingList.map(item => {
                        const fruitStr = getFruitCount(item.name, item.amount);
                        return (
                            <li key={item.id} className="flex flex-col sm:flex-row sm:items-center bg-bar-900 p-3 rounded-lg group gap-3">
                                <div className="flex items-center flex-1">
                                    <button 
                                        onClick={() => toggleShoppingItem(item.id)}
                                        className={`flex-shrink-0 w-5 h-5 rounded border mr-3 flex items-center justify-center transition-colors ${item.checked ? 'bg-bar-accent border-bar-accent' : 'border-gray-500'}`}
                                    >
                                        {item.checked && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                    </button>
                                    <div className={`flex-1 ${item.checked ? 'opacity-50 line-through' : ''}`}>
                                        <span className="text-white block font-medium capitalize leading-tight">
                                            {item.name}
                                            {fruitStr && <span className="text-bar-accent text-xs ml-2 font-bold whitespace-nowrap">{fruitStr}</span>}
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="flex items-center justify-between sm:justify-end gap-3 pl-8 sm:pl-0">
                                     <div className="flex items-center bg-bar-800 rounded-lg p-1 border border-bar-700">
                                        <button 
                                            onClick={() => updateItemAmount(item.id, -1)}
                                            className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-white rounded hover:bg-bar-700"
                                        >
                                            -
                                        </button>
                                        <span className="text-xs text-bar-gold font-mono w-20 text-center px-1">
                                            {item.amount > 0 ? item.amount.toLocaleString(undefined, {maximumFractionDigits: 1}) : '0'} {item.unit}
                                        </span>
                                        <button 
                                            onClick={() => updateItemAmount(item.id, 1)}
                                            className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-white rounded hover:bg-bar-700"
                                        >
                                            +
                                        </button>
                                    </div>

                                    <button 
                                        onClick={() => removeShoppingItem(item.id)}
                                        className="text-gray-600 hover:text-red-500 transition-colors p-1"
                                        title="Remove item"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
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