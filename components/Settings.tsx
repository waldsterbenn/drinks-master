import React, { useState, useEffect } from 'react';
import { getDB, updateInventory, updateSettings } from '../services/db';
import { AppState, InventoryItem } from '../types';

const Settings: React.FC = () => {
  const [state, setState] = useState<AppState | null>(null);

  useEffect(() => {
    setState(getDB());
  }, []);

  if (!state) return null;

  const toggleInventory = (name: string) => {
      const newInv = state.inventory.map(i => i.name === name ? { ...i, owned: !i.owned } : i);
      updateInventory(newInv);
      setState({ ...state, inventory: newInv });
  };

  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newTheme = e.target.value as 'default' | 'tropical';
      const newSettings = { ...state.settings, theme: newTheme };
      updateSettings(newSettings);
      setState({ ...state, settings: newSettings });
  };

  const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newUnit = e.target.value as 'ml' | 'oz' | 'cl';
      const newSettings = { ...state.settings, preferedUnit: newUnit };
      updateSettings(newSettings);
      setState({ ...state, settings: newSettings });
  };

  return (
    <div className="pb-24 pt-6 md:pt-24 px-4 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-8">Settings</h1>

      <section className="mb-10">
          <h2 className="text-xl font-bold text-bar-accent mb-4 border-b border-bar-700 pb-2">My Glassware</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {state.inventory.map(glass => (
                  <button 
                    key={glass.name}
                    onClick={() => toggleInventory(glass.name)}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center justify-center text-center ${glass.owned ? 'bg-bar-700 border-bar-accent text-white' : 'bg-bar-900 border-bar-800 text-gray-600 hover:border-gray-600'}`}
                  >
                      <span className="text-2xl mb-2 block">{glass.owned ? '🍷' : '🥛'}</span>
                      <span className="font-semibold text-sm">{glass.name}</span>
                      <span className="text-xs mt-1 opacity-70">{glass.volumeMl} ml</span>
                  </button>
              ))}
          </div>
      </section>

      <section className="mb-10">
          <h2 className="text-xl font-bold text-bar-accent mb-4 border-b border-bar-700 pb-2">Preferences</h2>
          <div className="bg-bar-800 rounded-xl p-6 border border-bar-700 space-y-4">
              <div className="flex justify-between items-center">
                  <span className="text-gray-300">Default Unit System</span>
                  <select 
                      className="bg-bar-900 border border-bar-700 text-white rounded px-3 py-1"
                      value={state.settings.preferedUnit}
                      onChange={handleUnitChange}
                  >
                      <option value="ml">Metric (ml)</option>
                      <option value="cl">Metric (cl)</option>
                      <option value="oz">Imperial (oz)</option>
                  </select>
              </div>
               <div className="flex justify-between items-center">
                  <span className="text-gray-300">Theme</span>
                  <select 
                    className="bg-bar-900 border border-bar-700 text-white rounded px-3 py-1"
                    value={state.settings.theme || 'default'}
                    onChange={handleThemeChange}
                  >
                      <option value="default">Dark Bar (Default)</option>
                      <option value="tropical">Tropical Tiki</option>
                  </select>
              </div>
          </div>
      </section>

      <section>
          <h2 className="text-xl font-bold text-bar-accent mb-4 border-b border-bar-700 pb-2">Data Management</h2>
           <div className="bg-bar-800 rounded-xl p-6 border border-bar-700">
               <p className="text-gray-400 text-sm mb-4">
                   Currently using local browser storage. Clearing browser data will lose your recipes.
               </p>
               <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="text-red-500 border border-red-500 px-4 py-2 rounded hover:bg-red-500 hover:text-white transition-colors">
                   Reset App Data
               </button>
           </div>
      </section>
    </div>
  );
};

export default Settings;