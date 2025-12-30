import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Recipe, AppState } from '../types';
import { getDB, updateRecipe, addToParty } from '../services/db';

const RecipeView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [servings, setServings] = useState(1);
  const [partyCount, setPartyCount] = useState(0);

  useEffect(() => {
    const db = getDB();
    const found = db.recipes.find(r => r.id === id);
    if (found) {
        setRecipe(found);
        const partyItem = db.partyList.find(p => p.recipeId === id);
        if (partyItem) setPartyCount(partyItem.count);
    } else {
        navigate('/');
    }
  }, [id, navigate]);

  const handleRating = (r: number) => {
    if (!recipe) return;
    // If rating is set, assume tried is true
    const updated = { ...recipe, rating: r, tried: true };
    setRecipe(updated);
    updateRecipe(updated);
  };

  const toggleFavorite = () => {
    if (!recipe) return;
    const updated = { ...recipe, isFavorite: !recipe.isFavorite };
    setRecipe(updated);
    updateRecipe(updated);
  };

  const toggleTried = () => {
    if (!recipe) return;
    const updated = { ...recipe, tried: !recipe.tried };
    setRecipe(updated);
    updateRecipe(updated);
  };

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if(!recipe) return;
      const updated = { ...recipe, userNotes: e.target.value };
      setRecipe(updated);
      updateRecipe(updated); // In a real app we might debounce this
  };

  const toggleParty = (delta: number) => {
      if(!recipe) return;
      const newCount = Math.max(0, partyCount + delta);
      setPartyCount(newCount);
      addToParty(recipe.id, newCount);
  }

  const incrementServings = () => {
    if (servings >= 2) {
        setServings(servings + 1);
    } else if (servings === 1.5) {
        setServings(2);
    } else if (servings === 1) {
        setServings(1.5);
    } else if (servings === 0.75) {
        setServings(1);
    } else {
        setServings(0.75); // Assumes start from 0.5
    }
  };

  const decrementServings = () => {
    if (servings > 2) {
        setServings(servings - 1);
    } else if (servings === 2) {
        setServings(1.5);
    } else if (servings === 1.5) {
        setServings(1);
    } else if (servings === 1) {
        setServings(0.75);
    } else if (servings === 0.75) {
        setServings(0.5);
    }
  };

  if (!recipe) return <div>Loading...</div>;

  const totalVolume = recipe.ingredients.reduce((acc, ing) => {
      return acc + (ing.unit === 'ml' ? ing.amount : 0);
  }, 0) * servings;

  return (
    <div className="pb-24 pt-6 md:pt-24 px-4 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left Column: Ingredients */}
        <div className="flex-1">
          <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white mb-4 flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back
          </button>
          
          <div className="flex justify-between items-start mb-2">
            <h1 className="text-4xl font-extrabold text-white">{recipe.title}</h1>
            <button 
                onClick={toggleFavorite}
                className={`p-2 rounded-full transition-colors ${recipe.isFavorite ? 'text-bar-accent' : 'text-gray-600 hover:text-gray-400'}`}
                title="Toggle Favorite"
            >
                <svg className="w-8 h-8" fill={recipe.isFavorite ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
            </button>
          </div>
          <p className="text-gray-400 italic mb-6">{recipe.credits}</p>

          <div className="bg-bar-800 rounded-2xl p-6 border border-bar-700 shadow-xl mb-6">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-bar-700">
                <span className="text-gray-400 uppercase text-sm font-semibold tracking-wider">Servings</span>
                <div className="flex items-center space-x-4">
                    <button onClick={decrementServings} className="w-10 h-10 rounded-full bg-bar-700 hover:bg-bar-600 flex items-center justify-center text-xl font-bold text-bar-accent">-</button>
                    <span className="text-2xl font-bold w-12 text-center">{servings}</span>
                    <button onClick={incrementServings} className="w-10 h-10 rounded-full bg-bar-700 hover:bg-bar-600 flex items-center justify-center text-xl font-bold text-bar-accent">+</button>
                </div>
            </div>

            <ul className="space-y-4">
                {recipe.ingredients.map((ing, idx) => {
                    const scaledAmount = ing.amount * servings;
                    return (
                        <li key={idx} className="flex justify-between items-center text-lg">
                            <span className="font-medium text-white">{ing.name}</span>
                            <span className="font-bold text-bar-gold">
                                {scaledAmount > 0 ? scaledAmount.toLocaleString(undefined, { maximumFractionDigits: 2 }) : ''} 
                                <span className="text-sm text-gray-400 ml-1">{ing.unit}</span>
                            </span>
                        </li>
                    )
                })}
            </ul>

            <div className="mt-6 pt-4 border-t border-bar-700 flex justify-between text-sm text-gray-500">
                <span>Total Liquid: ~{(totalVolume).toFixed(0)} ml</span>
                <span>Glass: <span className="text-bar-accent">{recipe.glassware}</span></span>
            </div>
          </div>

           {/* Metrics (Mocked for now) */}
           <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-bar-800 p-4 rounded-xl border border-bar-700">
                    <div className="text-gray-400 text-xs uppercase">Strength</div>
                    <div className="text-xl font-bold text-white">~18%</div>
                </div>
                <div className="bg-bar-800 p-4 rounded-xl border border-bar-700">
                    <div className="text-gray-400 text-xs uppercase">Flavor</div>
                    <div className="text-xl font-bold text-white">Sour / Sweet</div>
                </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-8">
                {recipe.tags.map(tag => (
                    <span key={tag} className="text-sm bg-bar-900 border border-bar-700 text-gray-300 px-3 py-1 rounded-full">#{tag}</span>
                ))}
            </div>

        </div>

        {/* Right Column: Instructions & Actions */}
        <div className="flex-1 space-y-6">
            <div className="bg-bar-800 rounded-2xl p-6 border border-bar-700">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                    <svg className="w-6 h-6 mr-2 text-bar-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                    Preparation
                </h2>
                <div className="prose prose-invert text-lg leading-relaxed whitespace-pre-line text-gray-200">
                    {recipe.instructions}
                </div>
                {recipe.garnish && (
                    <div className="mt-6 p-4 bg-bar-700/30 rounded-lg border border-bar-700/50">
                        <span className="text-bar-accent font-bold uppercase text-xs tracking-wider block mb-1">Garnish</span>
                        <span className="text-white font-medium">{recipe.garnish}</span>
                    </div>
                )}
            </div>

            <div className="bg-bar-800 rounded-2xl p-6 border border-bar-700">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-white mb-0">Rating</h3>
                    <label className="flex items-center cursor-pointer select-none group">
                        <div className="relative">
                            <input 
                                type="checkbox" 
                                className="sr-only" 
                                checked={recipe.tried || false}
                                onChange={toggleTried}
                            />
                            <div className={`w-5 h-5 border rounded transition-all duration-200 flex items-center justify-center ${recipe.tried ? 'bg-green-600 border-green-600' : 'bg-bar-900 border-gray-500 group-hover:border-gray-400'}`}>
                                <svg className={`w-3 h-3 text-white transition-opacity duration-200 ${recipe.tried ? 'opacity-100' : 'opacity-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        </div>
                        <span className={`ml-2 text-sm font-medium transition-colors ${recipe.tried ? 'text-green-500' : 'text-gray-400 group-hover:text-gray-300'}`}>
                            {recipe.tried ? 'Tried' : 'Not Tried'}
                        </span>
                    </label>
                </div>
                <div className="flex space-x-2">
                    {[1, 2, 3, 4, 5].map(star => (
                        <button key={star} onClick={() => handleRating(star)} className={`text-3xl focus:outline-none transition-transform hover:scale-110 ${recipe.rating && recipe.rating >= star ? 'text-bar-gold' : 'text-gray-600'}`}>
                            ★
                        </button>
                    ))}
                </div>
            </div>

             <div className="bg-bar-800 rounded-2xl p-6 border border-bar-700">
                <h3 className="text-lg font-bold text-white mb-4">Party Planner</h3>
                <div className="flex items-center justify-between">
                    <span className="text-gray-300">Add to menu</span>
                    <div className="flex items-center space-x-3 bg-bar-900 rounded-lg p-1">
                        <button onClick={() => toggleParty(-1)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white">-</button>
                        <span className="font-bold w-6 text-center">{partyCount}</span>
                        <button onClick={() => toggleParty(1)} className="w-8 h-8 flex items-center justify-center text-bar-accent font-bold">+</button>
                    </div>
                </div>
            </div>

            <div className="bg-bar-800 rounded-2xl p-6 border border-bar-700">
                <h3 className="text-lg font-bold text-white mb-2">My Notes</h3>
                <textarea 
                    value={recipe.userNotes || ''}
                    onChange={handleNoteChange}
                    placeholder="Add personal tasting notes, modifications, or ideas here..."
                    className="w-full bg-bar-900 border border-bar-700 rounded-lg p-3 text-white placeholder-gray-500 min-h-[100px] focus:ring-2 focus:ring-bar-accent focus:border-transparent outline-none"
                />
            </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeView;