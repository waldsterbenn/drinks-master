import React, { useState, useEffect } from 'react';
import { getDB, clearParty, addToParty, updateShoppingList } from '../services/db';
import { AppState, ShoppingItem, BarItem } from '../types';

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

  const activeInventory = state.isTempInventoryActive ? state.tempBarInventory : state.barInventory;

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

  const sortedIngredients = Object.values(calculatedIngredients).sort((a, b) => {
      const aIsGrocery = isGrocery(a.name);
      const bIsGrocery = isGrocery(b.name);
      if (aIsGrocery && !bIsGrocery) return -1;
      if (!aIsGrocery && bIsGrocery) return 1;
      return a.name.localeCompare(b.name);
  });

  const getInventoryMatch = (ingName: string) => {
      if (!activeInventory) return null;
      const lowerIng = ingName.toLowerCase();
      
      // 1. Exact Name match
      let match = activeInventory.find(i => i.name.toLowerCase() === lowerIng);
      
      // 2. Ingredient contains Inventory Name (e.g. "Lime Juice" contains "Lime")
      if (!match) {
          match = activeInventory
            .filter(i => lowerIng.includes(i.name.toLowerCase()))
            .sort((a, b) => b.name.length - a.name.length)[0];
      }

      // 3. Inventory Name contains Ingredient (e.g. "London Dry Gin" contains "Gin")
      if (!match) {
          match = activeInventory
            .filter(i => i.name.toLowerCase().includes(lowerIng))
            .sort((a, b) => a.name.length - b.name.length)[0];
      }
      return match || null;
  };

  const getInventoryRequirement = (ingName: string, amount: number) => {
      const match = getInventoryMatch(ingName);

      if (match && match.volumePrUnitMl > 0) {
          const units = Math.ceil(amount / match.volumePrUnitMl);
          return { count: units, name: match.name };
      }
      return null;
  };

  // --- Logic for Shopping List (Custom) ---

  const addToShoppingList = (ing: AggregatedItem) => {
      const newList = [...state.customShoppingList];
      
      const match = getInventoryMatch(ing.name);
      
      let targetName = ing.name;
      let targetAmount = ing.totalAmount;
      let targetUnit = ing.unit;

      if (match && match.volumePrUnitMl > 0) {
          // Smart Add: Add only what we need to buy
          const unitsNeeded = Math.ceil(ing.totalAmount / match.volumePrUnitMl);
          const buyCount = Math.max(0, unitsNeeded - match.stockCount);
          
          targetName = match.name;
          targetAmount = buyCount; // Default to buying missing amount. If 0, adds 0 (user can adjust).
          targetUnit = 'pcs'; 
      }

      // Check if similar item exists to merge
      const existingIdx = newList.findIndex(i => i.name.toLowerCase() === targetName.toLowerCase() && i.unit === targetUnit);
      
      if (existingIdx >= 0) {
          newList[existingIdx].amount += targetAmount;
          newList[existingIdx].checked = false; // Uncheck on update
      } else {
          newList.push({
              id: Math.random().toString(36).substr(2, 9),
              name: targetName,
              amount: targetAmount,
              unit: targetUnit,
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
                   if (u === 'ml') step = 10;
                   else if (u === 'cl') step = 1;
                   else if (u === 'oz') step = 0.5;
                   else if (u === 'l') step = 0.05;
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
                 <p className="text-xs text-gray-400 mt-1">Click to add missing amounts to shopping list.</p>
             </div>
             
             {sortedIngredients.length === 0 ? (
                 <p className="text-gray-500 italic">Add cocktails to see ingredients needed.</p>
             ) : (
                 <ul className="divide-y divide-bar-700">
                     {sortedIngredients.map((item, idx) => {
                         const match = getInventoryMatch(item.name);
                         
                         let rightSideContent;
                         const centerContent = (
                            <div className="flex flex-col items-center justify-center">
                                <span className="text-bar-gold font-bold font-mono text-xl">
                                    {item.totalAmount.toLocaleString(undefined, {maximumFractionDigits: 0})}
                                    <span className="text-sm text-gray-500 ml-1 font-normal">{item.unit}</span>
                                </span>
                                <span className="text-[10px] text-gray-600 uppercase tracking-wider">Required</span>
                            </div>
                         );

                         if (match && match.volumePrUnitMl > 0) {
                              // Inventory Item Logic
                              const unitsNeeded = Math.ceil(item.totalAmount / match.volumePrUnitMl);
                              const stock = match.stockCount;
                              const buy = Math.max(0, unitsNeeded - stock);
                              
                              rightSideContent = (
                                  <div className="flex items-center gap-2 sm:gap-4">
                                      <div className="flex flex-col items-center">
                                          <span className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Stock</span>
                                          <span className={`font-mono font-bold text-xl ${stock >= unitsNeeded ? 'text-green-400' : 'text-gray-600'}`}>
                                              {stock}
                                          </span>
                                      </div>
                                      <div className="w-px h-8 bg-bar-700"></div>
                                      <div className="flex flex-col items-center">
                                          <span className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Buy</span>
                                          <span className={`font-mono font-bold text-xl ${buy > 0 ? 'text-red-500' : 'text-gray-600'}`}>
                                              {buy}
                                          </span>
                                      </div>
                                  </div>
                              );
                         } else {
                             // Standard Ingredient Logic (No inventory match)
                             rightSideContent = (
                                <div className="flex items-center gap-2 sm:gap-4">
                                      <div className="flex flex-col items-center opacity-20">
                                          <span className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Stock</span>
                                          <span className="font-mono font-bold text-xl text-gray-600">-</span>
                                      </div>
                                      <div className="w-px h-8 bg-bar-700"></div>
                                      <div className="flex flex-col items-center">
                                          <span className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Buy</span>
                                          <span className="font-mono font-bold text-xl text-red-500">
                                              {item.totalAmount.toLocaleString(undefined, {maximumFractionDigits: 0})}
                                              <span className="text-xs ml-0.5">{item.unit}</span>
                                          </span>
                                      </div>
                                </div>
                             );
                         }
                         
                         return (
                            <li 
                                key={idx} 
                                onClick={() => addToShoppingList(item)}
                                className="py-4 flex items-center justify-between cursor-pointer group hover:bg-bar-900 px-2 sm:px-4 rounded-lg -mx-2 transition-colors border-b border-bar-700/50 last:border-0"
                            >
                                <div className="flex items-center w-1/3 pr-2">
                                    <span className="text-bar-accent opacity-0 group-hover:opacity-100 mr-2 transition-opacity text-xl font-bold hidden sm:inline">+</span>
                                    <div className="flex flex-col overflow-hidden">
                                        <span className={`text-base sm:text-lg text-gray-200 capitalize truncate ${isGrocery(item.name) ? 'font-semibold text-white' : ''}`} title={item.name}>
                                            {item.name}
                                        </span>
                                        {match && <span className="text-[10px] text-gray-500 truncate">{match.name}</span>}
                                    </div>
                                </div>

                                <div className="flex-1 flex justify-center px-2">
                                    {centerContent}
                                </div>

                                <div className="w-1/3 flex justify-end">
                                    {rightSideContent}
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
                        // Check if this item maps to an inventory item
                        const invMatch = activeInventory ? activeInventory.find(i => i.name === item.name) : null;
                        const requirement = !invMatch ? getInventoryRequirement(item.name, item.amount) : null;

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
                                        </span>
                                        {invMatch && (
                                            <span className="text-xs text-bar-accent font-medium block mt-0.5">
                                                Yields approx. {(item.amount * invMatch.volumePrUnitMl).toLocaleString()} ml
                                            </span>
                                        )}
                                        {requirement && (
                                            <span className="text-xs text-bar-accent font-medium block mt-0.5">
                                                Buy: {requirement.count} {requirement.name}
                                            </span>
                                        )}
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
                                            {item.amount > 0 ? item.amount.toLocaleString(undefined, {maximumFractionDigits: 1}) : '0'} 
                                            {/* Hide unit if it's an inventory item match to reduce clutter, or if unit is 'pcs' */}
                                            {!invMatch && ` ${item.unit}`}
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