import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import RecipeList from './components/RecipeList';
import RecipeView from './components/RecipeView';
import ImportView from './components/ImportView';
import PartyPlanner from './components/PartyPlanner';
import Settings from './components/Settings';
import { getDB } from './services/db';
import { AppState } from './types';

const App: React.FC = () => {
  const [dbState, setDbState] = useState<AppState | null>(null);

  const refreshState = () => {
    const db = getDB();
    setDbState(db);
    applyTheme(db.settings.theme);
  };

  const applyTheme = (themeName?: 'default' | 'tropical') => {
      const root = document.documentElement;
      if (themeName === 'tropical') {
          root.style.setProperty('--color-bar-900', '#004d40');
          root.style.setProperty('--color-bar-800', '#00695c');
          root.style.setProperty('--color-bar-700', '#00796b');
          root.style.setProperty('--color-bar-accent', '#ff6f00');
          root.style.setProperty('--color-bar-gold', '#ffeb3b');
          root.style.setProperty('--color-bar-text', '#e0f2f1');
      } else {
          // Default
          root.style.setProperty('--color-bar-900', '#1a1a2e');
          root.style.setProperty('--color-bar-800', '#16213e');
          root.style.setProperty('--color-bar-700', '#0f3460');
          root.style.setProperty('--color-bar-accent', '#e94560');
          root.style.setProperty('--color-bar-gold', '#ffd700');
          root.style.setProperty('--color-bar-text', '#e2e8f0');
      }
  };

  // Initial load and subscription to DB changes
  useEffect(() => {
    refreshState();
    window.addEventListener('db-change', refreshState);
    return () => {
      window.removeEventListener('db-change', refreshState);
    };
  }, []);

  if (!dbState) return <div className="h-screen w-full flex items-center justify-center bg-bar-900 text-bar-accent">Loading MixMaster...</div>;

  return (
    <HashRouter>
      <div className="min-h-screen bg-bar-900 text-white font-sans selection:bg-bar-accent selection:text-white transition-colors duration-500">
        <Routes>
          <Route path="/" element={<RecipeList recipes={dbState.recipes} />} />
          <Route path="/recipe/:id" element={<RecipeView />} />
          <Route path="/import" element={<ImportView />} />
          <Route path="/party" element={<PartyPlanner />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
        <NavBar />
      </div>
    </HashRouter>
  );
};

export default App;
