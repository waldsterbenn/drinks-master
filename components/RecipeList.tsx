import React, { useState, useMemo } from 'react';
import { Recipe } from '../types';
import { Link } from 'react-router-dom';

interface RecipeListProps {
  recipes: Recipe[];
}

const RecipeList: React.FC<RecipeListProps> = ({ recipes }) => {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFavorites, setShowFavorites] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [triedFilter, setTriedFilter] = useState<'all' | 'tried' | 'untried'>('all');

  const filteredRecipes = useMemo(() => {
    let result = recipes;

    if (showFavorites) {
        result = result.filter(r => r.isFavorite);
    }

    if (minRating > 0) {
        result = result.filter(r => (r.rating || 0) >= minRating);
    }

    if (triedFilter === 'tried') {
        result = result.filter(r => r.tried);
    } else if (triedFilter === 'untried') {
        result = result.filter(r => !r.tried);
    }

    const lowerSearch = search.toLowerCase();
    if (lowerSearch) {
        result = result.filter(r => {
            const inTitle = r.title.toLowerCase().includes(lowerSearch);
            const inTags = r.tags.some(t => t.toLowerCase().includes(lowerSearch));
            const inIngredients = r.ingredients.some(i => i.name.toLowerCase().includes(lowerSearch));
            return inTitle || inTags || inIngredients;
        });
    }
    return result;
  }, [recipes, search, showFavorites, minRating, triedFilter]);

  const cycleTriedFilter = () => {
      if (triedFilter === 'all') setTriedFilter('tried');
      else if (triedFilter === 'tried') setTriedFilter('untried');
      else setTriedFilter('all');
  };

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
        
        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
            {/* Rating Filter Widget */}
            <div className="bg-bar-800 rounded-xl border border-bar-700 h-16 flex items-center justify-center px-4 flex-grow sm:flex-grow-0">
                <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            onClick={() => setMinRating(minRating === star ? 0 : star)}
                            className={`text-2xl focus:outline-none transition-all hover:scale-110 ${
                                minRating >= star ? 'text-bar-gold' : 'text-gray-600 hover:text-gray-500'
                            }`}
                            title={minRating === star ? "Clear filter" : `Filter ${star}+ stars`}
                        >
                            ★
                        </button>
                    ))}
                </div>
            </div>

            {/* Tried Status Filter Widget */}
            <button
                onClick={cycleTriedFilter}
                className={`h-16 px-4 flex items-center justify-center rounded-xl border transition-colors flex-grow sm:flex-grow-0 ${
                    triedFilter === 'tried' ? 'bg-green-900/20 text-green-500 border-green-500/50' :
                    triedFilter === 'untried' ? 'bg-bar-800 text-gray-300 border-gray-500 border-dashed' :
                    'bg-bar-800 text-gray-400 border-bar-700 hover:text-white'
                }`}
                title={triedFilter === 'all' ? "Filter by Status" : triedFilter === 'tried' ? "Showing Tried" : "Showing Untried"}
            >
                 {triedFilter === 'all' && (
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                     </svg>
                 )}
                 {triedFilter === 'tried' && (
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                     </svg>
                 )}
                 {triedFilter === 'untried' && (
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01" />
                     </svg>
                 )}
            </button>

            <button
                onClick={() => setShowFavorites(!showFavorites)}
                className={`h-16 px-4 flex items-center justify-center rounded-xl border border-bar-700 transition-colors flex-grow sm:flex-grow-0 ${showFavorites ? 'bg-bar-accent text-white border-bar-accent' : 'bg-bar-800 text-gray-400 hover:text-white'}`}
                title="Show Favorites"
            >
                <svg className="w-6 h-6" fill={showFavorites ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
            </button>

            <div className="flex bg-bar-800 rounded-xl p-1 border border-bar-700 h-16 w-full sm:w-auto">
                <button 
                    onClick={() => setViewMode('grid')}
                    className={`flex-1 sm:w-16 flex items-center justify-center rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-bar-700 text-bar-accent' : 'text-gray-400 hover:text-white'}`}
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                </button>
                <button 
                    onClick={() => setViewMode('list')}
                    className={`flex-1 sm:w-16 flex items-center justify-center rounded-lg transition-colors ${viewMode === 'list' ? 'bg-bar-700 text-bar-accent' : 'text-gray-400 hover:text-white'}`}
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
            </div>
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
                     <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                        {recipe.isFavorite && <span className="text-bar-accent drop-shadow-md">❤️</span>}
                        {recipe.tried && <span className="text-green-500 bg-bar-900/80 rounded-full p-0.5 border border-green-900/50 shadow-sm" title="Tried">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                        </span>}
                     </div>
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
                         <div className="w-12 h-12 bg-bar-700 rounded-full flex items-center justify-center text-xl relative">
                             🍹
                             <div className="absolute -top-1 -right-1 flex gap-0.5">
                                 {recipe.isFavorite && <span className="text-xs">❤️</span>}
                             </div>
                             {recipe.tried && <div className="absolute bottom-0 right-0 text-green-500 bg-bar-900 rounded-full border border-bar-800">
                                 <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                             </div>}
                         </div>
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
                <p className="text-xl">No cocktails found matching your criteria.</p>
                <p className="mt-2">Try adjusting your search, rating filter, or favorites.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default RecipeList;