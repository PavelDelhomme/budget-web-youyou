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
  const containerRef = useRef<HTMLDivElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);

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
        className={`w-full px-3 py-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 text-left flex items-center justify-between ${
          error
            ? 'border-red-500 dark:border-red-600 focus:ring-red-500 dark:focus:ring-red-600'
            : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 dark:focus:ring-blue-400'
        }`}
        style={{
          backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 0.5rem center',
          backgroundSize: '1.5em 1.5em',
          paddingRight: '2.5rem',
        }}
      >
        <span className={!selectedOption ? 'text-gray-500 dark:text-gray-400' : ''}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
      </button>

      {/* Dropdown scrollable */}
      {isOpen && (
        <div
          className="absolute z-[9999] w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl overflow-hidden"
          style={{
            maxHeight: 'min(60vh, 450px)',
          }}
        >
          <div
            className="overflow-y-auto overflow-x-hidden py-1 scrollable-select-dropdown"
            style={{
              maxHeight: 'min(60vh, 450px)',
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
                className={`w-full px-3 py-2.5 text-left hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors ${
                  option.value === value
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 font-medium'
                    : 'text-gray-900 dark:text-white'
                }`}
                style={{
                  minHeight: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  wordBreak: 'break-word',
                  whiteSpace: 'normal',
                }}
              >
                <span className="block w-full">{option.label}</span>
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

