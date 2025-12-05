import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface FloatingActionButtonProps {
  onAddExpense: () => void;
  onAddIncome: () => void;
  hidden?: boolean; // Si true, cache le bouton
}

// Créer le container Portal globalement, hors du composant React
// Cela garantit qu'il persiste même si React ne remonte pas le composant
function getOrCreatePortalContainer(): HTMLDivElement {
  let container = document.getElementById('fab-portal-container') as HTMLDivElement;
  
  if (!container && document.body) {
    console.log('📦 Création globale du container Portal...');
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
    console.log('✅ Container Portal créé globalement !', container);
  }
  
  return container;
}

export function FloatingActionButton({ onAddExpense, onAddIncome, hidden = false }: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [containerReady, setContainerReady] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  // Fermer le menu si le bouton est caché
  useEffect(() => {
    if (hidden && isOpen) {
      setIsOpen(false);
    }
  }, [hidden, isOpen]);

  // Cacher le container portal si le bouton est caché
  useEffect(() => {
    if (containerRef.current) {
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
    }
  }, [hidden]);

  // Ne rien rendre si le bouton est caché
  if (hidden) {
    return null;
  }

  // Initialiser le Portal - TOUJOURS, même si React se remonte
  useEffect(() => {
    console.log('🔧 FloatingActionButton - Montage du composant...');
    
    const initPortal = () => {
      if (!document.body) {
        console.log('⏳ Attente de document.body...');
        return false;
      }
      
      const container = getOrCreatePortalContainer();
      if (container) {
        containerRef.current = container;
        setContainerReady(true);
        
        // Forcer les styles
        container.style.pointerEvents = 'auto';
        container.style.display = 'block';
        container.style.visibility = 'visible';
        container.style.opacity = '1';
        
        console.log('✅ Container Portal prêt !', container);
        return true;
      }
      
      return false;
    };
    
    // Essayer immédiatement
    if (!initPortal()) {
      // Attendre document.body
      const waitInterval = setInterval(() => {
        if (initPortal()) {
          clearInterval(waitInterval);
        }
      }, 50);
      
      return () => clearInterval(waitInterval);
    }
    
    // Vérification périodique que le container existe toujours
    const checkInterval = setInterval(() => {
      if (document.body) {
        const existing = document.getElementById('fab-portal-container');
        if (!existing) {
          console.warn('⚠️ Container Portal supprimé ! Recréation...');
          const container = getOrCreatePortalContainer();
          if (container) {
            containerRef.current = container;
            setContainerReady(true);
          }
        } else if (containerRef.current !== existing) {
          // Container existe mais ref pas synchronisée
          containerRef.current = existing as HTMLDivElement;
          setContainerReady(true);
        }
      }
    }, 500);
    
    return () => {
      clearInterval(checkInterval);
      // NE PAS supprimer le container au démontage
    };
  }, []); // Une seule fois

  // Vérification périodique de visibilité
  useEffect(() => {
    if (!containerReady) return;
    
    const checkVisibility = () => {
      const container = containerRef.current;
      const button = buttonRef.current;
      
      if (!container || !document.body.contains(container)) {
        console.error('❌ Container absent du DOM !');
        const newContainer = getOrCreatePortalContainer();
        if (newContainer) {
          containerRef.current = newContainer;
          setContainerReady(true);
        }
        return;
      }
      
      // Forcer la visibilité
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
      
      if (button) {
        const buttonRect = button.getBoundingClientRect();
        if (buttonRect.width === 0 || buttonRect.height === 0) {
          button.style.width = '64px';
          button.style.height = '64px';
          button.style.display = 'flex';
        }
      }
    };
    
    // Vérifications immédiates et périodiques
    const timeouts = [
      setTimeout(checkVisibility, 50),
      setTimeout(checkVisibility, 200),
      setTimeout(checkVisibility, 500),
      setTimeout(checkVisibility, 1000),
    ];
    
    const interval = setInterval(checkVisibility, 2000);
    
    return () => {
      timeouts.forEach(clearTimeout);
      clearInterval(interval);
    };
  }, [containerReady]);

  // Si le container n'est pas prêt, essayer de le créer immédiatement
  if (!containerReady || !containerRef.current) {
    // Essayer une dernière fois de créer le container
    if (document.body) {
      const container = getOrCreatePortalContainer();
      if (container) {
        containerRef.current = container;
        setContainerReady(true);
      }
    }
    // Si toujours pas prêt, retourner null mais continuer à essayer
    if (!containerReady || !containerRef.current) {
      return null;
    }
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
          console.log('🎯 Bouton cliqué !', isOpen);
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
