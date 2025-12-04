import { useState, useRef, useEffect } from 'react';

interface ScrollableSelectOption {
  value: string;
  label: string;
}

interface ScrollableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: ScrollableSelectOption[];
  placeholder?: string;
  className?: string;
  required?: boolean;
  error?: boolean;
}

export function ScrollableSelect({
  value,
  onChange,
  options,
  placeholder = 'Sélectionnez...',
  className = '',
  required = false,
  error = false,
}: ScrollableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [maxHeight, setMaxHeight] = useState(450);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);

  // Calculer la hauteur max dynamiquement
  useEffect(() => {
    const calculateMaxHeight = () => {
      if (typeof window !== 'undefined') {
        const viewportHeight = window.innerHeight;
        const calculated = Math.min(viewportHeight * 0.6, 450);
        setMaxHeight(calculated);
      }
    };

    calculateMaxHeight();
    window.addEventListener('resize', calculateMaxHeight);
    return () => window.removeEventListener('resize', calculateMaxHeight);
  }, []);

  // Ajouter les styles CSS directement dans le DOM
  useEffect(() => {
    const styleId = 'scrollable-select-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .scrollable-select-dropdown {
          scrollbar-width: thin !important;
          scrollbar-color: rgba(156, 163, 175, 0.8) rgba(229, 231, 235, 0.3) !important;
          -webkit-overflow-scrolling: touch !important;
        }
        .scrollable-select-dropdown::-webkit-scrollbar {
          width: 10px !important;
        }
        .scrollable-select-dropdown::-webkit-scrollbar-track {
          background: rgba(229, 231, 235, 0.5) !important;
          border-radius: 5px !important;
        }
        .scrollable-select-dropdown::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.8) !important;
          border-radius: 5px !important;
          border: 2px solid transparent !important;
          background-clip: padding-box !important;
        }
        .scrollable-select-dropdown::-webkit-scrollbar-thumb:hover {
          background: rgba(107, 114, 128, 1) !important;
          background-clip: padding-box !important;
        }
        .dark .scrollable-select-dropdown::-webkit-scrollbar-track {
          background: rgba(55, 65, 81, 0.5) !important;
        }
        .dark .scrollable-select-dropdown::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.7) !important;
        }
        .dark .scrollable-select-dropdown::-webkit-scrollbar-thumb:hover {
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
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  // Fermer avec Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen]);

  const selectedOption = options.find(opt => opt.value === value);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Input visible qui simule le select */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2.5 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 text-left flex items-center justify-between transition-colors ${
          error
            ? 'border-red-500 dark:border-red-600 focus:ring-red-500 dark:focus:ring-red-600'
            : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 dark:focus:ring-blue-400 hover:border-gray-400 dark:hover:border-gray-500'
        }`}
        style={{
          backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 0.75rem center',
          backgroundSize: '1.25em 1.25em',
          paddingRight: '2.75rem',
        }}
      >
        <span className={`block truncate ${!selectedOption ? 'text-gray-500 dark:text-gray-400' : ''}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
      </button>

      {/* Dropdown scrollable */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-[9999] w-full mt-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-2xl overflow-hidden"
          style={{
            maxHeight: `${maxHeight}px`,
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div
            className="scrollable-select-dropdown overflow-y-auto overflow-x-hidden py-1"
            style={{
              maxHeight: `${maxHeight}px`,
              WebkitOverflowScrolling: 'touch',
              scrollBehavior: 'smooth',
              overscrollBehavior: 'contain',
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(156, 163, 175, 0.8) rgba(229, 231, 235, 0.3)',
            }}
          >
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
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
                <span className="block w-full break-words whitespace-normal">{option.label}</span>
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
            ))}
          </div>
        </div>
      )}

      {/* Select caché pour la validation HTML */}
      <select
        ref={selectRef}
        value={value}
        onChange={() => {}} // Contrôlé par notre composant
        className="sr-only"
        required={required}
      >
        <option value="">{placeholder}</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}
