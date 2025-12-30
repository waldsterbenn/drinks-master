import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const NavBar: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path ? 'text-bar-accent border-b-2 border-bar-accent' : 'text-gray-400 hover:text-white';

  return (
    <nav className="fixed bottom-0 md:top-0 md:bottom-auto w-full bg-bar-800 border-t md:border-t-0 md:border-b border-bar-700 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="hidden md:flex items-center">
            <span className="text-xl font-bold text-bar-accent tracking-wider">CockMaster2000</span>
          </div>
          
          <div className="flex w-full md:w-auto justify-around md:space-x-8">
            <Link to="/" className={`px-3 py-2 text-sm font-medium transition-colors ${isActive('/')}`}>
              Recipes
            </Link>
            <Link to="/party" className={`px-3 py-2 text-sm font-medium transition-colors ${isActive('/party')}`}>
              Party
            </Link>
            <Link to="/import" className={`px-3 py-2 text-sm font-medium transition-colors ${isActive('/import')}`}>
              Import
            </Link>
            <Link to="/settings" className={`px-3 py-2 text-sm font-medium transition-colors ${isActive('/settings')}`}>
              Settings
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;