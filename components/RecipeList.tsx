import React, { useState, useMemo } from 'react';
import { Recipe } from '../types';
import { Link } from 'react-router-dom';

interface RecipeListProps {
  recipes: Recipe[];
}

const RecipeList: React.FC<RecipeListProps> = ({ recipes }) => {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredRecipes = useMemo(() => {
    const lowerSearch = search.toLowerCase();
    if (!lowerSearch) return recipes;

    return recipes.filter(r => {
      const inTitle = r.title.toLowerCase().includes(lowerSearch);
      const inTags = r.tags.some(t => t.toLowerCase().includes(lowerSearch));
      const inIngredients = r.ingredients.some(i => i.name.toLowerCase().includes(lowerSearch));
      return inTitle || inTags || inIngredients;
    });
  }, [recipes, search]);

  return (
    <div className="pb-24 pt-6 md:pt-24 px-4 max-w-7xl mx-auto">
      <div className="mb-8 flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="Search cocktails, ingredients, tags..."
            className="w-full bg-bar-800 border border-bar-700 rounded-xl py-4 px-6 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-bar-accent text-lg shadow-inner"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="absolute right-4 top-4 text-gray-500">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
          </div>
        </div>
        <div className="flex bg-bar-800 rounded-xl p-1 border border-bar-700 h-16 w-full md:w-auto">
            <button 
                onClick={() => setViewMode('grid')}
                className={`flex-1 md:w-16 flex items-center justify-center rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-bar-700 text-bar-accent' : 'text-gray-400 hover:text-white'}`}
            >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            </button>
            <button 
                onClick={() => setViewMode('list')}
                className={`flex-1 md:w-16 flex items-center justify-center rounded-lg transition-colors ${viewMode === 'list' ? 'bg-bar-700 text-bar-accent' : 'text-gray-400 hover:text-white'}`}
            >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
        </div>
      </div>

      <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
        {filteredRecipes.map(recipe => (
          <Link key={recipe.id} to={`/recipe/${recipe.id}`} className="block group">
            {viewMode === 'grid' ? (
                // GRID VIEW
                <div className="bg-bar-800 rounded-xl overflow-hidden border border-bar-700 shadow-md hover:shadow-bar-accent/20 hover:border-bar-accent transition-all duration-300 h-full flex flex-col">
                  <div className="h-32 bg-gradient-to-br from-bar-700 to-bar-900 flex items-center justify-center relative">
                     <div className="text-4xl">🍹</div>
                     <div className="absolute bottom-2 right-2 flex gap-1">
                        {recipe.rating ? Array.from({length: recipe.rating}).map((_, i) => (
                            <span key={i} className="text-bar-gold text-xs">★</span>
                        )) : null}
                     </div>
                  </div>
                  <div className="p-5 flex-grow">
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-bar-accent transition-colors">{recipe.title}</h3>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {recipe.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-xs bg-bar-700 text-gray-300 px-2 py-1 rounded-full">#{tag}</span>
                      ))}
                    </div>
                    <p className="text-gray-400 text-sm line-clamp-2">{recipe.instructions}</p>
                  </div>
                  <div className="px-5 py-3 bg-bar-900/50 border-t border-bar-700 flex justify-between items-center text-xs text-gray-500">
                      <span>{recipe.ingredients.length} ingredients</span>
                      <span>{recipe.glassware}</span>
                  </div>
                </div>
            ) : (
                // LIST VIEW
                <div className="bg-bar-800 rounded-lg p-4 border border-bar-700 hover:border-bar-accent flex items-center justify-between transition-colors">
                    <div className="flex items-center space-x-4">
                         <div className="w-12 h-12 bg-bar-700 rounded-full flex items-center justify-center text-xl">🍹</div>
                         <div>
                             <h3 className="text-lg font-bold text-white group-hover:text-bar-accent">{recipe.title}</h3>
                             <div className="flex items-center space-x-2 text-xs text-gray-400">
                                 <span>{recipe.glassware}</span>
                                 <span>•</span>
                                 <span>{recipe.ingredients.length} ingr.</span>
                             </div>
                         </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="hidden sm:flex space-x-1">
                             {recipe.rating ? Array.from({length: recipe.rating}).map((_, i) => (
                                <span key={i} className="text-bar-gold text-xs">★</span>
                            )) : null}
                        </div>
                        <svg className="w-5 h-5 text-gray-500 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </div>
                </div>
            )}
          </Link>
        ))}
        {filteredRecipes.length === 0 && (
            <div className="col-span-full text-center py-20 text-gray-500">
                <p className="text-xl">No cocktails found matching "{search}"</p>
                <p className="mt-2">Try searching for an ingredient like "rum" or "lime"</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default RecipeList;