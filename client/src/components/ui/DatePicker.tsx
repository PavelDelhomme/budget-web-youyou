import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  error?: boolean;
  min?: string;
  max?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Sélectionner une date',
  className = '',
  required = false,
  error = false,
  min,
  max,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [calendarPosition, setCalendarPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const [displayMonth, setDisplayMonth] = useState<number>(() => {
    if (value) {
      const date = new Date(value + 'T00:00:00');
      return date.getMonth();
    }
    return new Date().getMonth();
  });
  const [displayYear, setDisplayYear] = useState<number>(() => {
    if (value) {
      const date = new Date(value + 'T00:00:00');
      return date.getFullYear();
    }
    return new Date().getFullYear();
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const portalContainerRef = useRef<HTMLDivElement | null>(null);

  // Créer ou récupérer le container portal
  useEffect(() => {
    if (!portalContainerRef.current && typeof document !== 'undefined') {
      let container = document.getElementById('datepicker-portal');
      if (!container) {
        container = document.createElement('div');
        container.id = 'datepicker-portal';
        container.style.cssText = 'position: fixed; z-index: 999999; pointer-events: none;';
        document.body.appendChild(container);
      }
      portalContainerRef.current = container;
    }
  }, []);

  // Calculer la position du calendrier au-dessus de l'input
  const updateCalendarPosition = () => {
    if (!containerRef.current || !inputRef.current || !isOpen) {
      setCalendarPosition(null);
      return;
    }

    const inputRect = inputRef.current.getBoundingClientRect();
    const calendarHeight = 320; // Hauteur approximative du calendrier
    
    // Positionner au-dessus de l'input avec un petit espace
    let top = inputRect.top + window.scrollY - calendarHeight - 8; // 8px d'espace
    
    // Si pas assez de place au-dessus, vérifier l'espace disponible
    const spaceAbove = inputRect.top;
    const spaceBelow = window.innerHeight - inputRect.bottom;
    
    // Si pas assez de place au-dessus mais plus de place en dessous, afficher en dessous
    if (spaceAbove < calendarHeight && spaceBelow > spaceAbove) {
      top = inputRect.bottom + window.scrollY + 8;
    }
    
    const left = inputRect.left + window.scrollX;
    const width = Math.max(inputRect.width, 280); // Largeur minimum pour le calendrier

    setCalendarPosition({ top, left, width });
  };

  // Gérer l'ouverture/fermeture
  useEffect(() => {
    if (isOpen) {
      updateCalendarPosition();
      const handleUpdate = () => {
        updateCalendarPosition();
      };
      window.addEventListener('scroll', handleUpdate, true);
      window.addEventListener('resize', handleUpdate);
      return () => {
        window.removeEventListener('scroll', handleUpdate, true);
        window.removeEventListener('resize', handleUpdate);
      };
    } else {
      setCalendarPosition(null);
    }
  }, [isOpen]);

  // Fermer le calendrier si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      }
    };

    if (isOpen) {
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
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen]);

  const handleDateSelect = (date: string) => {
    onChange(date);
    setIsOpen(false);
  };

  const formatDateForDisplay = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  // Générer le calendrier
  const generateCalendar = () => {
    const today = new Date();
    const currentMonth = displayMonth;
    const currentYear = displayYear;
    
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Lundi = 0
    
    const days: (number | null)[] = [];
    // Remplir les jours vides avant le 1er jour du mois
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Ajouter tous les jours du mois
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    const monthNames = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    
    const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];


    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4">
        {/* En-tête du calendrier */}
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (currentMonth === 0) {
                setDisplayMonth(11);
                setDisplayYear(currentYear - 1);
              } else {
                setDisplayMonth(currentMonth - 1);
              }
            }}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {monthNames[currentMonth]} {currentYear}
          </h3>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (currentMonth === 11) {
                setDisplayMonth(0);
                setDisplayYear(currentYear + 1);
              } else {
                setDisplayMonth(currentMonth + 1);
              }
            }}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Jours de la semaine */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Grille du calendrier */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }

            const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isSelected = value === dateString;
            const isToday = 
              day === today.getDate() && 
              currentMonth === today.getMonth() && 
              currentYear === today.getFullYear();
            const isPast = new Date(dateString) < new Date(today.toISOString().split('T')[0]);
            
            // Vérifier les contraintes min/max
            let isDisabled = false;
            if (min && dateString < min) isDisabled = true;
            if (max && dateString > max) isDisabled = true;

            return (
              <button
                key={day}
                type="button"
                onClick={() => !isDisabled && handleDateSelect(dateString)}
                disabled={isDisabled}
                className={`
                  aspect-square flex items-center justify-center text-sm rounded
                  ${isSelected
                    ? 'bg-blue-600 text-white font-semibold'
                    : isToday
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 font-semibold'
                    : isPast
                    ? 'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                    : 'text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                  }
                  ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                {day}
              </button>
            );
          })}
        </div>

        {/* Input date natif caché pour la validation */}
        <input
          type="date"
          value={value}
          onChange={(e) => handleDateSelect(e.target.value)}
          min={min}
          max={max}
          className="sr-only"
          required={required}
        />
      </div>
    );
  };

  // Rendre le calendrier dans le portal
  const renderCalendar = () => {
    if (!isOpen || !calendarPosition || !portalContainerRef.current) return null;

    return (
      <div
        ref={calendarRef}
        className="fixed"
        style={{
          top: `${calendarPosition.top}px`,
          left: `${calendarPosition.left}px`,
          width: `${calendarPosition.width}px`,
          zIndex: 999999,
          pointerEvents: 'auto',
        }}
      >
        {generateCalendar()}
      </div>
    );
  };

  return (
    <>
      <div className={`relative ${className}`} ref={containerRef}>
        <input
          ref={inputRef}
          type="text"
          value={formatDateForDisplay(value)}
          readOnly
          onClick={() => setIsOpen(!isOpen)}
          placeholder={placeholder}
          required={required}
          className={`w-full px-3 py-2.5 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white appearance-none focus:outline-none focus:ring-2 transition-colors pr-10 cursor-pointer ${
            error
              ? 'border-red-500 dark:border-red-600 focus:ring-red-500 dark:focus:ring-red-600'
              : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 dark:focus:ring-blue-400 hover:border-gray-400 dark:hover:border-gray-500'
          }`}
        />
        {/* Icône calendrier */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <svg
            className="h-5 w-5 text-gray-400 dark:text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      </div>

      {/* Calendrier rendu dans le portal pour être au premier plan et au-dessus */}
      {portalContainerRef.current && createPortal(renderCalendar(), portalContainerRef.current)}
    </>
  );
}

