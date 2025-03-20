import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Beer, Menu, X } from 'lucide-react';
import SparkleWrapper from './Sparkles';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-gradient-to-r from-eggplant-900/90 via-dark-900/95 to-eggplant-900/90 backdrop-blur-sm text-dark-100 shadow-lg border-b-2 border-neon-blue shadow-[0_2px_4px_-1px_rgba(0,255,255,0.3)] relative">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-3 sm:py-4">
          <SparkleWrapper>
            <Link to="/" className="flex items-center space-x-2 group relative z-10">
              <Beer className="h-8 w-8 sm:h-10 sm:w-10 text-neon-purple group-hover:text-neon-blue transition-colors duration-300" />
              <span className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-neon-purple via-neon-pink to-neon-blue bg-clip-text text-transparent">
                Israel's Journey Planner
              </span>
            </Link>
          </SparkleWrapper>

          <div className="hidden md:flex space-x-1 relative z-10">
            <SparkleWrapper>
              <Link
                to="/"
                className={`glass-button px-6 py-2 rounded-lg transition-all relative ${
                  isActive('/') 
                    ? 'bg-gradient-to-r from-eggplant-600 via-eggplant-500 to-eggplant-600 text-eggplant-50 shadow-neon-purple' 
                    : 'hover:bg-dark-800/50 text-eggplant-100'
                }`}
              >
                Home
              </Link>
            </SparkleWrapper>
            <SparkleWrapper>
              <Link
                to="/planner"
                className={`glass-button px-6 py-2 rounded-lg transition-all relative ${
                  isActive('/planner')
                    ? 'bg-gradient-to-r from-eggplant-600 via-eggplant-500 to-eggplant-600 text-eggplant-50 shadow-neon-purple'
                    : 'hover:bg-dark-800/50 text-eggplant-100'
                }`}
              >
                Planner
              </Link>
            </SparkleWrapper>
            <SparkleWrapper>
              <Link
                to="/about"
                className={`glass-button px-6 py-2 rounded-lg transition-all relative ${
                  isActive('/about')
                    ? 'bg-gradient-to-r from-eggplant-600 via-eggplant-500 to-eggplant-600 text-eggplant-50 shadow-neon-purple'
                    : 'hover:bg-dark-800/50 text-eggplant-100'
                }`}
              >
                About
              </Link>
            </SparkleWrapper>
          </div>

          <div className="md:hidden relative z-10">
            <SparkleWrapper>
              <button
                onClick={toggleMenu}
                className="text-eggplant-100 p-2 focus:outline-none"
                aria-label="Toggle menu"
              >
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </SparkleWrapper>
          </div>
        </div>

        {isOpen && (
          <div className="md:hidden py-4 border-t border-eggplant-800/50 relative z-10">
            <div className="flex flex-col space-y-2">
              <SparkleWrapper>
                <Link
                  to="/"
                  className={`glass-button px-4 py-2 rounded-lg transition-colors ${
                    isActive('/') 
                      ? 'bg-gradient-to-r from-eggplant-600 via-eggplant-500 to-eggplant-600 text-eggplant-50' 
                      : 'hover:bg-dark-800/50 text-eggplant-100'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  Home
                </Link>
              </SparkleWrapper>
              <SparkleWrapper>
                <Link
                  to="/planner"
                  className={`glass-button px-4 py-2 rounded-lg transition-colors ${
                    isActive('/planner')
                      ? 'bg-gradient-to-r from-eggplant-600 via-eggplant-500 to-eggplant-600 text-eggplant-50'
                      : 'hover:bg-dark-800/50 text-eggplant-100'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  Planner
                </Link>
              </SparkleWrapper>
              <SparkleWrapper>
                <Link
                  to="/about"
                  className={`glass-button px-4 py-2 rounded-lg transition-colors ${
                    isActive('/about')
                      ? 'bg-gradient-to-r from-eggplant-600 via-eggplant-500 to-eggplant-600 text-eggplant-50'
                      : 'hover:bg-dark-800/50 text-eggplant-100'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  About
                </Link>
              </SparkleWrapper>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;