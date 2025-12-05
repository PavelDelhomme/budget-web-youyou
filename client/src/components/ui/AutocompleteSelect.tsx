import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface AutocompleteSelectOption {
  value: string;
  label: string;
}

interface AutocompleteSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: AutocompleteSelectOption[];
  placeholder?: string;
  className?: string;
  required?: boolean;
  error?: boolean;
}

export function AutocompleteSelect({
  value,
  onChange,
  options,
  placeholder = 'Rechercher...',
  className = '',
  required = false,
  error = false,
}: AutocompleteSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [maxHeight, setMaxHeight] = useState(450);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const portalContainerRef = useRef<HTMLDivElement | null>(null);

  const selectedOption = options.find(opt => opt.value === value);

  // Filtrer les options en fonction du terme de recherche
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Créer ou récupérer le container portal
  useEffect(() => {
    if (!portalContainerRef.current && typeof document !== 'undefined') {
      let container = document.getElementById('autocomplete-dropdown-portal');
      if (!container) {
        container = document.createElement('div');
        container.id = 'autocomplete-dropdown-portal';
        container.style.cssText = 'position: fixed; z-index: 999999; pointer-events: none;';
        document.body.appendChild(container);
      }
      portalContainerRef.current = container;
    }
    return () => {
      // Nettoyer le portal si nécessaire
    };
  }, []);

  // Calculer la position du dropdown par rapport à l'input
  const updateDropdownPosition = () => {
    if (!containerRef.current || !inputRef.current || !isOpen) {
      setDropdownPosition(null);
      return;
    }

    const inputRect = inputRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - inputRect.bottom;
    const spaceAbove = inputRect.top;
    
    // Calculer la hauteur maximale disponible
    const maxAvailableHeight = Math.max(spaceBelow, spaceAbove);
    const calculatedHeight = Math.min(maxAvailableHeight * 0.9, 450, viewportHeight * 0.6);
    setMaxHeight(calculatedHeight);
    
    // Positionner le dropdown
    const top = inputRect.bottom + window.scrollY + 6;
    const left = inputRect.left + window.scrollX;
    const width = inputRect.width;

    setDropdownPosition({ top, left, width });
  };

  // Gérer l'ouverture/fermeture et la recherche
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      // Si une valeur est déjà sélectionnée, l'utiliser comme terme de recherche initial
      if (selectedOption && !searchTerm) {
        setSearchTerm(selectedOption.label);
      }
      updateDropdownPosition();
    } else if (!isOpen) {
      // Réinitialiser la recherche à la fermeture
      if (selectedOption) {
        setSearchTerm(selectedOption.label);
      } else {
        setSearchTerm('');
      }
      setDropdownPosition(null);
    }
  }, [isOpen, selectedOption]);

  // Mettre à jour la position lors du scroll et resize
  useEffect(() => {
    if (!isOpen) return;

    updateDropdownPosition();

    const handleUpdate = () => {
      updateDropdownPosition();
    };

    window.addEventListener('scroll', handleUpdate, true);
    window.addEventListener('resize', handleUpdate);
    
    return () => {
      window.removeEventListener('scroll', handleUpdate, true);
      window.removeEventListener('resize', handleUpdate);
    };
  }, [isOpen, filteredOptions.length]);

  // Ajouter les styles CSS pour le scroll
  useEffect(() => {
    const styleId = 'autocomplete-select-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .autocomplete-select-dropdown {
          scrollbar-width: thin !important;
          scrollbar-color: rgba(156, 163, 175, 0.8) rgba(229, 231, 235, 0.3) !important;
          -webkit-overflow-scrolling: touch !important;
          overflow-y: auto !important;
          overflow-x: hidden !important;
        }
        .autocomplete-select-dropdown::-webkit-scrollbar {
          width: 10px !important;
          display: block !important;
        }
        .autocomplete-select-dropdown::-webkit-scrollbar-track {
          background: rgba(229, 231, 235, 0.5) !important;
          border-radius: 5px !important;
        }
        .autocomplete-select-dropdown::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.8) !important;
          border-radius: 5px !important;
          border: 2px solid transparent !important;
          background-clip: padding-box !important;
        }
        .autocomplete-select-dropdown::-webkit-scrollbar-thumb:hover {
          background: rgba(107, 114, 128, 1) !important;
          background-clip: padding-box !important;
        }
        .dark .autocomplete-select-dropdown::-webkit-scrollbar-track {
          background: rgba(55, 65, 81, 0.5) !important;
        }
        .dark .autocomplete-select-dropdown::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.7) !important;
        }
        .dark .autocomplete-select-dropdown::-webkit-scrollbar-thumb:hover {
          background: rgba(156, 163, 175, 0.9) !important;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // Fermer le dropdown si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      }
    };

    if (isOpen) {
      // Délai pour éviter la fermeture immédiate lors du clic sur l'input
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  // Gestion du clavier
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      if (event.key === 'Escape') {
        setIsOpen(false);
        setSearchTerm(selectedOption?.label || '');
      } else if (event.key === 'Enter' && filteredOptions.length > 0) {
        // Sélectionner la première option filtrée avec Enter
        handleSelect(filteredOptions[0].value);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, filteredOptions]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    const selected = options.find(opt => opt.value === optionValue);
    setSearchTerm(selected?.label || '');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    if (!isOpen) {
      setIsOpen(true);
    }
    // Si le terme correspond exactement à une option, la sélectionner automatiquement
    const exactMatch = options.find(opt => opt.label.toLowerCase() === term.toLowerCase());
    if (exactMatch) {
      onChange(exactMatch.value);
    }
    // Mettre à jour la position
    setTimeout(updateDropdownPosition, 0);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    if (selectedOption && searchTerm === selectedOption.label) {
      // Sélectionner tout le texte pour faciliter la modification
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.select();
        }
      }, 0);
    }
    setTimeout(updateDropdownPosition, 0);
  };

  const handleInputBlur = () => {
    // Délai pour permettre le clic sur une option
    setTimeout(() => {
      if (!dropdownRef.current?.matches(':hover')) {
        setIsOpen(false);
      }
    }, 200);
  };

  // Rendre le dropdown dans le portal
  const renderDropdown = () => {
    if (!isOpen || !dropdownPosition || !portalContainerRef.current) return null;

    return (
      <div
        ref={dropdownRef}
        className="fixed bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-2xl overflow-hidden"
        style={{
          top: `${dropdownPosition.top}px`,
          left: `${dropdownPosition.left}px`,
          width: `${dropdownPosition.width}px`,
          maxHeight: `${maxHeight}px`,
          zIndex: 999999,
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          pointerEvents: 'auto',
        }}
      >
        <div
          className="autocomplete-select-dropdown py-1"
          style={{
            maxHeight: `${maxHeight}px`,
            WebkitOverflowScrolling: 'touch',
            scrollBehavior: 'smooth',
            overscrollBehavior: 'contain',
          }}
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => {
              // Mettre en évidence la partie correspondante dans le label
              const lowerSearchTerm = searchTerm.toLowerCase();
              const lowerLabel = option.label.toLowerCase();
              const index = lowerLabel.indexOf(lowerSearchTerm);
              
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  onMouseDown={(e) => {
                    // Empêcher le blur de l'input lors du clic
                    e.preventDefault();
                  }}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-600 active:bg-gray-200 dark:active:bg-gray-500 transition-colors duration-150 ${
                    option.value === value
                      ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-900 dark:text-blue-100 font-medium'
                      : 'text-gray-900 dark:text-white'
                  }`}
                  style={{
                    minHeight: '44px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <span className="block w-full break-words whitespace-normal">
                    {index !== -1 && searchTerm ? (
                      <>
                        {option.label.substring(0, index)}
                        <span className="bg-yellow-200 dark:bg-yellow-800 font-semibold">
                          {option.label.substring(index, index + searchTerm.length)}
                        </span>
                        {option.label.substring(index + searchTerm.length)}
                      </>
                    ) : (
                      option.label
                    )}
                  </span>
                  {option.value === value && (
                    <svg
                      className="ml-2 h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })
          ) : (
            <div className="px-4 py-3 text-gray-500 dark:text-gray-400 text-sm text-center">
              Aucun résultat trouvé
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className={`relative ${className}`} ref={containerRef}>
        {/* Input de recherche */}
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={isOpen ? searchTerm : (selectedOption?.label || '')}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder={placeholder}
            required={required}
            className={`w-full px-3 py-2.5 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white appearance-none focus:outline-none focus:ring-2 transition-colors pr-10 ${
              error
                ? 'border-red-500 dark:border-red-600 focus:ring-red-500 dark:focus:ring-red-600'
                : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 dark:focus:ring-blue-400 hover:border-gray-400 dark:hover:border-gray-500'
            }`}
          />
          {/* Icône de recherche */}
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
            {isOpen ? (
              <svg
                className="h-5 w-5 text-gray-400 dark:text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg
                className="h-5 w-5 text-gray-400 dark:text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
          </div>
        </div>
      </div>

      {/* Dropdown rendu dans le portal pour être au premier plan */}
      {portalContainerRef.current && createPortal(renderDropdown(), portalContainerRef.current)}

      {/* Select caché pour la validation HTML */}
      <select
        value={value}
        onChange={() => {}}
        className="sr-only"
        required={required}
      >
        <option value="">{placeholder}</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </>
  );
}
