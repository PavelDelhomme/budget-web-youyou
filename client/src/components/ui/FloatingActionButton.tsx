import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface FloatingActionButtonProps {
  onAddExpense: () => void;
  onAddIncome: () => void;
}

export function FloatingActionButton({ onAddExpense, onAddIncome }: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [containerReady, setContainerReady] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const initAttemptedRef = useRef(false);

  // Créer le container directement dans le body avec Portal - GARANTIR qu'il persiste
  useEffect(() => {
    // Éviter les doubles initialisations
    if (initAttemptedRef.current) {
      return;
    }
    initAttemptedRef.current = true;

    console.log('🔧 FloatingActionButton - Initialisation du Portal...');
    
    const initPortal = () => {
      // Vérifier si le container existe déjà
      let container = document.getElementById('fab-portal-container') as HTMLDivElement;
      
      if (!container) {
        console.log('📦 Création du container Portal...');
        container = document.createElement('div');
        container.id = 'fab-portal-container';
        container.style.cssText = `
          position: fixed !important;
          bottom: 24px !important;
          right: 24px !important;
          z-index: 999999 !important;
          pointer-events: none !important;
        `;
        document.body.appendChild(container);
        console.log('✅ Container Portal créé !', container);
      } else {
        console.log('✅ Container Portal existe déjà, réutilisation', container);
      }
      
      containerRef.current = container;
      
      // Forcer la visibilité
      container.style.pointerEvents = 'auto';
      container.style.display = 'block';
      container.style.visibility = 'visible';
      container.style.opacity = '1';
      
      setContainerReady(true);
      
      // Vérifier périodiquement que le container est toujours présent
      const checkInterval = setInterval(() => {
        const existingContainer = document.getElementById('fab-portal-container');
        if (!existingContainer && containerRef.current) {
          console.warn('⚠️ Container Portal supprimé ! Recréation...');
          // Recréer le container
          const newContainer = document.createElement('div');
          newContainer.id = 'fab-portal-container';
          newContainer.style.cssText = `
            position: fixed !important;
            bottom: 24px !important;
            right: 24px !important;
            z-index: 999999 !important;
            pointer-events: auto !important;
          `;
          document.body.appendChild(newContainer);
          containerRef.current = newContainer;
        }
      }, 1000);
      
      return () => {
        clearInterval(checkInterval);
        // NE PAS supprimer le container au démontage
        // Il doit persister même si React se remonte
      };
    };
    
    // Initialiser immédiatement
    const cleanup = initPortal();
    
    // Retry si document.body n'est pas encore disponible
    if (!document.body) {
      console.log('⏳ Body pas encore disponible, attente...');
      const waitForBody = setInterval(() => {
        if (document.body) {
          clearInterval(waitForBody);
          initPortal();
        }
      }, 100);
      
      return () => {
        clearInterval(waitForBody);
        if (cleanup) cleanup();
      };
    }
    
    return cleanup;
  }, []); // Une seule fois au montage

  // Vérification périodique de visibilité
  useEffect(() => {
    if (!containerReady) return;
    
    const checkVisibility = () => {
      const container = containerRef.current;
      const button = buttonRef.current;
      
      if (!container) {
        console.error('❌ Container manquant !');
        // Recréer immédiatement
        const newContainer = document.createElement('div');
        newContainer.id = 'fab-portal-container';
        newContainer.style.cssText = `
          position: fixed !important;
          bottom: 24px !important;
          right: 24px !important;
          z-index: 999999 !important;
          pointer-events: auto !important;
        `;
        document.body.appendChild(newContainer);
        containerRef.current = newContainer;
        return;
      }
      
      // Forcer la visibilité du container
      if (container.style.pointerEvents !== 'auto') {
        container.style.pointerEvents = 'auto';
      }
      
      if (button) {
        const buttonRect = button.getBoundingClientRect();
        if (buttonRect.width === 0 || buttonRect.height === 0) {
          console.warn('⚠️ Bouton invisible, force les dimensions !');
          button.style.width = '64px';
          button.style.height = '64px';
          button.style.display = 'flex';
        }
      }
    };
    
    // Vérifications immédiates et périodiques
    setTimeout(checkVisibility, 50);
    setTimeout(checkVisibility, 200);
    setTimeout(checkVisibility, 500);
    
    const interval = setInterval(checkVisibility, 2000);
    
    return () => clearInterval(interval);
  }, [containerReady]);

  // Si le container n'est pas prêt, ne rien rendre
  if (!containerReady || !containerRef.current) {
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
