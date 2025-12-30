import React, { useState, useEffect, useMemo } from 'react';
import { getDB, updateBarInventory, setTempInventoryActive } from '../services/db';
import { AppState, BarItem } from '../types';

const InventoryManager: React.FC = () => {
  // Initialize state synchronously to ensure hooks run unconditionally
  const [state, setState] = useState<AppState>(() => getDB());
  const [search, setSearch] = useState('');
  
  // UI State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState<string | null>(null); // null = new, string = existing name
  
  // Form State
  const [formName, setFormName] = useState('');
  const [formVol, setFormVol] = useState('700');
  const [formCats, setFormCats] = useState('');

  useEffect(() => {
    // Subscribe to DB changes
    const handleDbChange = () => setState(getDB());
    window.addEventListener('db-change', handleDbChange);
    return () => window.removeEventListener('db-change', handleDbChange);
  }, []);

  // Removed the conditional return here to strictly follow Rules of Hooks
  // if (!state) return null; 

  const isTemp = state.isTempInventoryActive;
  const activeInventory = isTemp ? state.tempBarInventory : state.barInventory;

  const filteredItems = useMemo(() => {
      const lower = search.toLowerCase();
      // Ensure activeInventory exists (though it should given strict types)
      const inv = activeInventory || [];
      return inv.filter(item => 
          item.name.toLowerCase().includes(lower) || 
          item.categories.some(c => c.toLowerCase().includes(lower))
      ).sort((a, b) => a.name.localeCompare(b.name));
  }, [activeInventory, search]);

  // --- Actions ---

  const toggleStock = (name: string) => {
      const updated = activeInventory.map(item => 
          item.name === name ? { ...item, inStock: !item.inStock } : item
      );
      updateBarInventory(updated, isTemp);
  };

  const deleteItem = (name: string) => {
      if(!window.confirm(`Remove "${name}" from your inventory list?`)) return;
      const updated = activeInventory.filter(item => item.name !== name);
      updateBarInventory(updated, isTemp);
  };

  const copyMainToTemp = () => {
      if (!window.confirm("Overwrite temporary inventory with your main inventory?")) return;
      const mainCopy = state.barInventory.map(i => ({...i}));
      updateBarInventory(mainCopy, true);
  };

  const openModal = (item?: BarItem) => {
      if (item) {
          setEditingTarget(item.name);
          setFormName(item.name);
          setFormVol(item.volumePrUnitMl.toString());
          setFormCats(item.categories.join(', '));
      } else {
          setEditingTarget(null); // New mode
          setFormName('');
          setFormVol('700');
          setFormCats('');
      }
      setIsModalOpen(true);
  };

  const saveItem = () => {
      const trimmedName = formName.trim();
      const vol = parseInt(formVol) || 0;
      const cats = formCats.split(',').map(c => c.trim()).filter(c => c);

      if (!trimmedName) {
          alert("Item name is required");
          return;
      }

      // Check for duplicates (excluding self if editing)
      const exists = activeInventory.some(i => i.name.toLowerCase() === trimmedName.toLowerCase() && i.name !== editingTarget);
      if (exists) {
          alert("An item with this name already exists.");
          return;
      }

      let updatedList: BarItem[];

      if (editingTarget) {
          // Edit existing
          updatedList = activeInventory.map(item => {
              if (item.name === editingTarget) {
                  return {
                      name: trimmedName,
                      volumePrUnitMl: vol,
                      categories: cats,
                      inStock: item.inStock // Keep existing stock status
                  };
              }
              return item;
          });
      } else {
          // Add New
          updatedList = [
              ...activeInventory,
              {
                  name: trimmedName,
                  volumePrUnitMl: vol,
                  categories: cats,
                  inStock: true
              }
          ];
      }

      updateBarInventory(updatedList, isTemp);
      setIsModalOpen(false);
  };

  return (
    <div className="pb-24 pt-6 md:pt-24 px-4 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
            <h1 className="text-3xl font-bold text-white mb-1">
                {isTemp ? 'Temporary Bar' : 'My Bar Inventory'}
            </h1>
            <p className="text-gray-400 text-sm">
                {isTemp ? 'Managing a visiting inventory context.' : 'Your permanent bottle collection.'}
            </p>
        </div>
        
        <div className="flex bg-bar-800 p-1 rounded-lg border border-bar-700">
            <button 
                onClick={() => setTempInventoryActive(false)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${!isTemp ? 'bg-bar-700 text-white shadow' : 'text-gray-400 hover:text-white'}`}
            >
                Main Bar
            </button>
            <button 
                onClick={() => setTempInventoryActive(true)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${isTemp ? 'bg-bar-accent text-white shadow' : 'text-gray-400 hover:text-white'}`}
            >
                Temp Bar
            </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-bar-800 p-4 rounded-xl border border-bar-700 mb-6 flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Search items..."
                className="w-full bg-bar-900 border border-bar-700 rounded-lg py-2 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-bar-accent"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
          </div>
          
          <div className="flex gap-2">
            {isTemp && (
                <button 
                    onClick={copyMainToTemp}
                    className="bg-bar-700 hover:bg-bar-600 text-gray-200 px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
                >
                    Copy Main
                </button>
            )}
            <button 
                onClick={() => openModal()}
                className="bg-bar-accent hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shadow-lg shadow-red-900/20 font-semibold"
            >
                + Add Bottle
            </button>
          </div>
      </div>

      {/* Inventory List */}
      <div className="bg-bar-800 rounded-xl border border-bar-700 overflow-hidden shadow-xl">
          {filteredItems.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                  <p className="text-lg">No items found matching your search.</p>
                  <p className="text-sm mt-2">Try adding a new bottle or switching inventory modes.</p>
              </div>
          ) : (
              <table className="w-full text-left">
                  <thead className="bg-bar-900 text-gray-400 text-xs uppercase tracking-wider">
                      <tr>
                          <th className="p-4 w-16 text-center">Stock</th>
                          <th className="p-4">Item Name</th>
                          <th className="p-4 hidden sm:table-cell">Categories</th>
                          <th className="p-4 hidden sm:table-cell text-right">Vol (ml)</th>
                          <th className="p-4 text-right">Manage</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-bar-700">
                      {filteredItems.map(item => (
                          <tr key={item.name} className="hover:bg-bar-900/50 transition-colors group">
                              <td className="p-4 text-center">
                                  <button 
                                    onClick={() => toggleStock(item.name)}
                                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${item.inStock ? 'bg-green-600 border-green-500 text-white shadow-lg shadow-green-900/50' : 'border-gray-600 text-gray-600 hover:border-gray-400'}`}
                                    title={item.inStock ? "In Stock" : "Out of Stock"}
                                  >
                                      {item.inStock ? (
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                      ) : (
                                        <div className="w-2 h-2 rounded-full bg-gray-600"></div>
                                      )}
                                  </button>
                              </td>
                              <td className="p-4">
                                  <div className={`font-medium text-lg ${item.inStock ? 'text-white' : 'text-gray-500'}`}>{item.name}</div>
                                  <div className="sm:hidden text-xs text-gray-500 mt-1">{item.categories.join(', ')}</div>
                              </td>
                              <td className="p-4 hidden sm:table-cell">
                                  <div className="flex flex-wrap gap-1">
                                      {item.categories.map(c => (
                                          <span key={c} className="text-xs bg-bar-700 text-gray-300 px-2 py-0.5 rounded border border-bar-600">{c}</span>
                                      ))}
                                  </div>
                              </td>
                              <td className="p-4 hidden sm:table-cell text-right text-gray-400 font-mono">
                                  {item.volumePrUnitMl}
                              </td>
                              <td className="p-4 text-right">
                                  <div className="flex items-center justify-end gap-3 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => openModal(item)} className="text-bar-gold hover:text-white text-sm font-medium">Edit</button>
                                    <button onClick={() => deleteItem(item.name)} className="text-gray-600 hover:text-red-500" title="Delete">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                  </div>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          )}
      </div>

      {/* Edit Modal */}
      {isModalOpen && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
              <div className="bg-bar-800 rounded-2xl border border-bar-700 p-8 w-full max-w-lg shadow-2xl relative">
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="absolute top-4 right-4 text-gray-500 hover:text-white"
                  >
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>

                  <h2 className="text-2xl font-bold text-white mb-1">{editingTarget ? 'Edit Bottle' : 'Add New Bottle'}</h2>
                  <p className="text-gray-400 text-sm mb-6">{editingTarget ? `Updating details for ${editingTarget}` : 'Add a new item to your inventory definition.'}</p>
                  
                  <div className="space-y-5">
                      <div>
                          <label className="block text-bar-accent text-xs font-bold uppercase tracking-wider mb-2">Item Name</label>
                          <input 
                            type="text" 
                            className="w-full bg-bar-900 border border-bar-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-bar-accent outline-none transition-all placeholder-gray-600"
                            value={formName}
                            onChange={e => setFormName(e.target.value)}
                            placeholder="e.g. London Dry Gin"
                            autoFocus
                          />
                      </div>
                      <div>
                          <label className="block text-bar-accent text-xs font-bold uppercase tracking-wider mb-2">Categories <span className="text-gray-500 font-normal lowercase">(comma separated)</span></label>
                          <input 
                            type="text" 
                            className="w-full bg-bar-900 border border-bar-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-bar-accent outline-none transition-all placeholder-gray-600"
                            value={formCats}
                            onChange={e => setFormCats(e.target.value)}
                            placeholder="e.g. Spirit, Gin, Clear"
                          />
                      </div>
                      <div>
                          <label className="block text-bar-accent text-xs font-bold uppercase tracking-wider mb-2">Standard Volume (ml)</label>
                          <input 
                            type="number" 
                            className="w-full bg-bar-900 border border-bar-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-bar-accent outline-none transition-all placeholder-gray-600"
                            value={formVol}
                            onChange={e => setFormVol(e.target.value)}
                          />
                      </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-bar-700">
                      <button 
                        onClick={() => setIsModalOpen(false)}
                        className="px-6 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-bar-700 transition-colors font-medium"
                      >
                          Cancel
                      </button>
                      <button 
                        onClick={saveItem}
                        className="bg-bar-accent hover:bg-red-600 text-white px-8 py-2 rounded-lg font-bold transition-all shadow-lg shadow-red-900/20 active:transform active:scale-95"
                      >
                          {editingTarget ? 'Save Changes' : 'Add Item'}
                      </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default InventoryManager;