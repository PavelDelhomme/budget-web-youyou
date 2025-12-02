import { useMemo, useState, useEffect } from 'react';
import { ThemeToggle } from './ThemeToggle';

interface SidebarProps {
  years: number[];
  currentYear: number | 'dashboard';
  onYearSelect: (year: number | 'dashboard') => void;
  onAddYear: () => void;
  onLogout: () => void;
  sessionEmail: string;
  predictedYears: number[];
  onMaterializeYear?: (year: number) => void;
  onOpenGlobalData?: () => void;
  onOpenRevenus?: () => void;
  onOpenMLTraining?: () => void;
  onOpenTaxManager?: () => void;
  onOpenAdvancedFiscal?: () => void;
  isOpen?: boolean;
  onToggle?: () => void;
}

export function Sidebar({
  years,
  currentYear,
  onYearSelect,
  onAddYear,
  onLogout,
  sessionEmail,
  predictedYears = [],
  onMaterializeYear,
  onOpenGlobalData,
  onOpenRevenus,
  onOpenMLTraining,
  onOpenTaxManager,
  onOpenAdvancedFiscal,
  isOpen: controlledIsOpen,
  onToggle,
}: SidebarProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const setIsOpen = onToggle || (() => setInternalIsOpen(prev => !prev));

  // Fermer le drawer quand on sélectionne une année sur mobile
  const handleYearSelect = (year: number | 'dashboard') => {
    onYearSelect(year);
    // Fermer le drawer après sélection sur mobile
    if (window.innerWidth < 1024) {
      if (onToggle) {
        onToggle(); // Fermer si contrôlé depuis App
      } else {
        setInternalIsOpen(false);
      }
    }
  };

  const isPredicted = (y: number) => predictedYears.includes(y);
  
  // Calculer l'année actuelle
  const currentSystemYear = new Date().getFullYear();
  
  // Catégoriser les années
  const categorizedYears = useMemo(() => {
    const sortedYears = [...years].sort((a, b) => a - b);
    const past: number[] = [];
    const current: number[] = [];
    const future: number[] = [];
    
    sortedYears.forEach(year => {
      if (year < currentSystemYear) {
        past.push(year);
      } else if (year === currentSystemYear) {
        current.push(year);
      } else {
        future.push(year);
      }
    });
    
    return { past, current, future };
  }, [years, currentSystemYear]);

  // Fermer le drawer avec la touche Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, setIsOpen]);
  
  return (
    <>
      {/* Overlay - visible quand drawer ouvert sur mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 transition-opacity lg:hidden"
          onClick={setIsOpen}
          aria-hidden="true"
          style={{ zIndex: 55 }}
        />
      )}

      {/* Drawer */}
      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Navigation principale"
        style={{ zIndex: 56 }}
      >
        {/* Header avec bouton fermer */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Budget Annuel</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">{sessionEmail}</p>
          </div>
          {/* Bouton fermer - Visible sur tous les écrans */}
          <button
            onClick={setIsOpen}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
            aria-label="Fermer le menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Years Navigation */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Dashboard Button */}
          <div className="mb-4">
            <button
              onClick={() => handleYearSelect('dashboard')}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                currentYear === 'dashboard'
                  ? 'bg-blue-600 dark:bg-blue-500 text-white font-medium'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <span className="flex items-center gap-2">
                <span>📊</span>
                Dashboard
              </span>
            </button>
          </div>
          
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Années</h2>
            <button
              onClick={onAddYear}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="Ajouter une année"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          
          <nav className="space-y-3">
            {/* Année en cours */}
            {categorizedYears.current.length > 0 && (
              <div className="space-y-1">
                <div className="text-xs font-semibold text-green-600 dark:text-green-400 px-2 mb-1">
                  En cours
                </div>
                {categorizedYears.current.map((y) => {
                  const predicted = isPredicted(y);
                  return (
                    <div
                      key={y}
                      className={`group relative ${
                        y === currentYear && predicted
                          ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700'
                          : y === currentYear && typeof currentYear === 'number'
                          ? 'bg-green-600 dark:bg-green-500 text-white border-2 border-green-700 dark:border-green-400'
                          : ''
                      } rounded-lg transition-colors`}
                    >
                      <button
                        onClick={() => handleYearSelect(y)}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                          y === currentYear && !predicted
                            ? 'text-white font-bold'
                            : predicted
                            ? 'text-gray-500 dark:text-gray-400 hover:opacity-80'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          {y}
                          {predicted && (
                            <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded-full">
                              IA
                            </span>
                          )}
                          {y === currentSystemYear && !predicted && (
                            <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">
                              🔴
                            </span>
                          )}
                        </span>
                      </button>
                      {predicted && onMaterializeYear && y === currentYear && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onMaterializeYear(y);
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white text-xs px-2 py-1 rounded transition-opacity"
                          title="Créer cette année à partir de la prévision"
                        >
                          Créer
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Années futures */}
            {categorizedYears.future.length > 0 && (
              <div className="space-y-1">
                <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 px-2 mb-1">
                  Futures
                </div>
                {categorizedYears.future.map((y) => {
                  const predicted = isPredicted(y);
                  return (
                    <div
                      key={y}
                      className={`group relative ${
                        y === currentYear && predicted
                          ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700'
                          : y === currentYear && typeof currentYear === 'number'
                          ? 'bg-blue-600 dark:bg-blue-500 text-white'
                          : ''
                      } rounded-lg transition-colors`}
                    >
                      <button
                        onClick={() => handleYearSelect(y)}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                          y === currentYear && !predicted
                            ? 'text-white font-medium'
                            : predicted
                            ? 'text-gray-500 dark:text-gray-400 hover:opacity-80'
                            : 'text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          {y}
                          {predicted && (
                            <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded-full">
                              IA
                            </span>
                          )}
                        </span>
                      </button>
                      {predicted && onMaterializeYear && y === currentYear && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onMaterializeYear(y);
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white text-xs px-2 py-1 rounded transition-opacity"
                          title="Créer cette année à partir de la prévision"
                        >
                          Créer
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Années passées */}
            {categorizedYears.past.length > 0 && (
              <div className="space-y-1">
                <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 px-2 mb-1">
                  Passées
                </div>
                {categorizedYears.past.map((y) => {
                  const predicted = isPredicted(y);
                  return (
                    <div
                      key={y}
                      className={`group relative ${
                        y === currentYear && predicted
                          ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700'
                          : y === currentYear && typeof currentYear === 'number'
                          ? 'bg-gray-700 dark:bg-gray-600 text-white'
                          : ''
                      } rounded-lg transition-colors`}
                    >
                      <button
                        onClick={() => handleYearSelect(y)}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                          y === currentYear && !predicted
                            ? 'text-white font-medium'
                            : predicted
                            ? 'text-gray-400 dark:text-gray-500 hover:opacity-80'
                            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          {y}
                          {predicted && (
                            <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded-full">
                              IA
                            </span>
                          )}
                        </span>
                      </button>
                      {predicted && onMaterializeYear && y === currentYear && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onMaterializeYear(y);
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white text-xs px-2 py-1 rounded transition-opacity"
                          title="Créer cette année à partir de la prévision"
                        >
                          Créer
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </nav>
          
          {predictedYears.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Années avec <span className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 px-1 rounded">IA</span> sont des prévisions basées sur vos habitudes
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <ThemeToggle />
          {onOpenGlobalData && (
            <button
              onClick={onOpenGlobalData}
              className="w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-2"
            >
              <span>⚙️</span>
              Mes données
            </button>
          )}
          {onOpenRevenus && (
            <button
              onClick={onOpenRevenus}
              className="w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-2"
            >
              <span>💰</span>
              Revenus supplémentaires
            </button>
          )}
          {onOpenMLTraining && (
            <button
              onClick={onOpenMLTraining}
              className="w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-2"
            >
              <span>🤖</span>
              Entraînement IA
            </button>
          )}
          {onOpenTaxManager && (
            <button
              onClick={onOpenTaxManager}
              className="w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-2"
            >
              <span>💰</span>
              Calcul impôts
            </button>
          )}
          {onOpenAdvancedFiscal && (
            <button
              onClick={onOpenAdvancedFiscal}
              className="w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-2"
            >
              <span>🏛️</span>
              Déclarations fiscales
            </button>
          )}
          <button
            onClick={onLogout}
            className="w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            Déconnexion
          </button>
        </div>
      </aside>
    </>
  );
}
