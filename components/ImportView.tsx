import React, { useState } from 'react';
import { parseRecipeMarkdown } from '../services/parser';
import { addRecipes } from '../services/db';
import { useNavigate } from 'react-router-dom';

const EXAMPLE_MD = `# Don's Own Grog
- 22.5 ml Lime juice
- 7.5 ml Demerara syrup
- 1 dash Grenadine
- 15 ml Creme de mûre
- 30 ml Dark rum, Blended
- 1 dash Angostura bitters
____
## Garnish 💐
Grated Nutmeg
____
>Add all ingredients...

#cocktail-tiki
`;

const ImportView: React.FC = () => {
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const navigate = useNavigate();

  const handleImport = () => {
    try {
      const recipes = parseRecipeMarkdown(input);
      if (recipes.length === 0) {
          setStatus('error');
          return;
      }
      addRecipes(recipes);
      setStatus('success');
      setTimeout(() => navigate('/'), 1500);
    } catch (e) {
      console.error(e);
      setStatus('error');
    }
  };

  return (
    <div className="pb-24 pt-6 md:pt-24 px-4 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-6">Import Recipes</h1>
      
      <div className="bg-bar-800 p-6 rounded-2xl border border-bar-700 shadow-lg">
        <p className="text-gray-400 mb-4 text-sm">
            Paste your recipes in Markdown format. Support multiple recipes separated by newlines.
        </p>
        
        <textarea
          className="w-full h-96 bg-bar-900 border border-bar-700 rounded-lg p-4 font-mono text-sm text-gray-300 focus:ring-2 focus:ring-bar-accent focus:border-transparent outline-none"
          placeholder={EXAMPLE_MD}
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />

        <div className="mt-6 flex justify-between items-center">
            <div className="text-sm">
                {status === 'success' && <span className="text-green-500 font-bold">Import successful! Redirecting...</span>}
                {status === 'error' && <span className="text-red-500 font-bold">Could not parse recipes. Check format.</span>}
            </div>
            <button 
                onClick={handleImport}
                className="bg-bar-accent hover:bg-red-600 text-white font-bold py-3 px-8 rounded-lg transition-colors shadow-lg shadow-red-900/20"
            >
                Import Recipes
            </button>
        </div>
      </div>
    </div>
  );
};

export default ImportView;