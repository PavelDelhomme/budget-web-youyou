import React from 'react';

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
}: SidebarProps) {
  const isPredicted = (y: number) => predictedYears.includes(y);
  
  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-xl font-bold">Budget Annuel</h1>
        <p className="text-xs text-gray-500 mt-1 truncate">{sessionEmail}</p>
      </div>

      {/* Years Navigation */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Dashboard Button */}
        <div className="mb-4">
          <button
            onClick={() => onYearSelect('dashboard')}
            className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
              currentYear === 'dashboard'
                ? 'bg-blue-600 text-white font-medium'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <span className="flex items-center gap-2">
              <span>📊</span>
              Dashboard
            </span>
          </button>
        </div>
        
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700">Années</h2>
          <button
            onClick={onAddYear}
            className="text-gray-400 hover:text-gray-600 transition-colors"
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
        
        <nav className="space-y-1">
          {[...years].sort((a, b) => a - b).map((y) => {
            const predicted = isPredicted(y);
            return (
              <div
                key={y}
                className={`group relative ${
                  y === currentYear && predicted
                    ? 'bg-blue-50 border border-blue-200'
                    : y === currentYear && currentYear !== 'dashboard'
                    ? 'bg-black text-white'
                    : predicted
                    ? 'opacity-60'
                    : ''
                } rounded-lg transition-colors`}
              >
                <button
                  onClick={() => onYearSelect(y)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    y === currentYear && !predicted
                      ? 'text-white font-medium'
                      : predicted
                      ? 'text-gray-500 hover:opacity-80'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {y}
                    {predicted && (
                      <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
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
                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 rounded transition-opacity"
                    title="Créer cette année à partir de la prévision"
                  >
                    Créer
                  </button>
                )}
              </div>
            );
          })}
        </nav>
        
        {predictedYears.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-2">
              Années avec <span className="bg-blue-100 text-blue-600 px-1 rounded">IA</span> sont des prévisions basées sur vos habitudes
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        {onOpenGlobalData && (
          <button
            onClick={onOpenGlobalData}
            className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
          >
            <span>⚙️</span>
            Mes données
          </button>
        )}
        {onOpenRevenus && (
          <button
            onClick={onOpenRevenus}
            className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
          >
            <span>💰</span>
            Revenus supplémentaires
          </button>
        )}
        <button
          onClick={onLogout}
          className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Déconnexion
        </button>
      </div>
    </aside>
  );
}

