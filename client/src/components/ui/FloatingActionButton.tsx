import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface FloatingActionButtonProps {
  onAddExpense: () => void;
  onAddIncome: () => void;
  hidden?: boolean; // Si true, cache le bouton
}

// Créer le container Portal globalement, hors du composant React
function getOrCreatePortalContainer(): HTMLDivElement | null {
  if (typeof document === 'undefined' || !document.body) {
    return null;
  }
  
  let container = document.getElementById('fab-portal-container') as HTMLDivElement;
  
  if (!container) {
    container = document.createElement('div');
    container.id = 'fab-portal-container';
    container.style.cssText = `
      position: fixed !important;
      bottom: 24px !important;
      right: 24px !important;
      z-index: 999999 !important;
      pointer-events: auto !important;
      visibility: visible !important;
      opacity: 1 !important;
      display: block !important;
    `;
    document.body.appendChild(container);
  }
  
  return container;
}

export function FloatingActionButton({ onAddExpense, onAddIncome, hidden = false }: FloatingActionButtonProps) {
  // TOUS LES HOOKS DOIVENT ÊTRE APPELÉS TOUJOURS DANS LE MÊME ORDRE
  // AUCUN RETURN CONDITIONNEL AVANT LA FIN DE TOUS LES HOOKS
  
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  // Hook 1: Fermer le menu si le bouton est caché
  useEffect(() => {
    if (hidden && isOpen) {
      setIsOpen(false);
    }
  }, [hidden, isOpen]);

  // Hook 2: Initialiser et gérer le container Portal
  useEffect(() => {
    // Vérifier si on est côté client
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }
    
    // Initialiser le container
    const container = getOrCreatePortalContainer();
    if (container) {
      containerRef.current = container;
      
      // Appliquer les styles selon l'état hidden
      if (hidden) {
        container.style.display = 'none';
        container.style.visibility = 'hidden';
        container.style.opacity = '0';
        container.style.pointerEvents = 'none';
      } else {
        container.style.display = 'block';
        container.style.visibility = 'visible';
        container.style.opacity = '1';
        container.style.pointerEvents = 'auto';
      }
    }
    
    // Pas de cleanup nécessaire car le container doit persister
  }, [hidden]);

  // Hook 3: Mettre à jour les styles du container quand hidden change
  useEffect(() => {
    if (!containerRef.current) return;
    
    if (hidden) {
      containerRef.current.style.display = 'none';
      containerRef.current.style.visibility = 'hidden';
      containerRef.current.style.opacity = '0';
      containerRef.current.style.pointerEvents = 'none';
    } else {
      containerRef.current.style.display = 'block';
      containerRef.current.style.visibility = 'visible';
      containerRef.current.style.opacity = '1';
      containerRef.current.style.pointerEvents = 'auto';
    }
  }, [hidden]);

  // MAINTENANT, APRÈS TOUS LES HOOKS, on peut faire des returns conditionnels
  // Si caché, ne rien rendre
  if (hidden) {
    return null;
  }

  // Vérifier si le container existe, sinon essayer de le créer
  if (!containerRef.current && typeof document !== 'undefined' && document.body) {
    const container = getOrCreatePortalContainer();
    if (container) {
      containerRef.current = container;
    }
  }

  // Si toujours pas de container, ne rien rendre
  if (!containerRef.current) {
    return null;
  }

  const buttonContent = (
    <div 
      id="fab-container"
      className="fab-container"
      style={{ 
        position: 'relative',
        width: '64px',
        height: '64px',
        pointerEvents: 'auto'
      }}
    >
      {/* Menu déroulant */}
      {isOpen && (
        <div 
          style={{ 
            position: 'absolute',
            bottom: '64px',
            right: '0',
            marginBottom: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            zIndex: 999999,
            pointerEvents: 'auto'
          }}
        >
          {/* Bouton Ajouter Revenu */}
          <button
            onClick={() => {
              setIsOpen(false);
              onAddIncome();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: '#16a34a',
              color: 'white',
              padding: '12px 16px',
              borderRadius: '9999px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.2s',
              fontWeight: '600',
              fontSize: '14px',
              whiteSpace: 'nowrap',
              pointerEvents: 'auto'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#15803d'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#16a34a'}
          >
            <svg
              style={{ width: '24px', height: '24px', flexShrink: 0 }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span>Revenu</span>
          </button>
          
          {/* Bouton Ajouter Dépense */}
          <button
            onClick={() => {
              setIsOpen(false);
              onAddExpense();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: '#dc2626',
              color: 'white',
              padding: '12px 16px',
              borderRadius: '9999px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.2s',
              fontWeight: '600',
              fontSize: '14px',
              whiteSpace: 'nowrap',
              pointerEvents: 'auto'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#b91c1c'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
          >
            <svg
              style={{ width: '24px', height: '24px', flexShrink: 0 }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span>Dépense</span>
          </button>
        </div>
      )}

      {/* Bouton principal */}
      <button
        ref={buttonRef}
        id="fab-main-button"
        className="fab-main-button"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setIsOpen(!isOpen);
        }}
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: '#2563eb',
          color: 'white',
          border: '4px solid white',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 10px 30px rgba(37, 99, 235, 0.5), 0 0 0 4px rgba(255, 255, 255, 0.3)',
          transition: 'all 0.3s',
          transform: isOpen ? 'rotate(45deg) scale(1.1)' : 'scale(1)',
          outline: 'none',
          position: 'relative',
          visibility: 'visible',
          opacity: 1,
          pointerEvents: 'auto',
          zIndex: 999999
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.backgroundColor = '#1d4ed8';
            e.currentTarget.style.transform = 'scale(1.15)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.backgroundColor = '#2563eb';
            e.currentTarget.style.transform = 'scale(1)';
          } else {
            e.currentTarget.style.transform = 'rotate(45deg) scale(1.1)';
          }
        }}
        aria-label="Ajouter une dépense ou un revenu"
      >
        <svg
          style={{ width: '36px', height: '36px', pointerEvents: 'none' }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={4}
            d="M12 4v16m8-8H4"
          />
        </svg>
      </button>

      {/* Overlay pour fermer le menu en cliquant à l'extérieur */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            zIndex: 999998,
            pointerEvents: 'auto'
          }}
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );

  // Utiliser createPortal pour rendre directement dans le body
  return createPortal(buttonContent, containerRef.current);
}
