import { useState, useEffect, useRef } from 'react';

interface FloatingActionButtonProps {
  onAddExpense: () => void;
  onAddIncome: () => void;
}

export function FloatingActionButton({ onAddExpense, onAddIncome }: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const isMountedRef = useRef(true);

  // Debug : vérifier que le composant est bien monté et visible
  useEffect(() => {
    isMountedRef.current = true;
    console.log('✅ FloatingActionButton monté !');
    
    // Vérifier que le bouton est dans le DOM après un court délai
    const checkButton = () => {
      if (!isMountedRef.current) return;
      
      const container = containerRef.current;
      const button = buttonRef.current;
      
      if (container) {
        const rect = container.getBoundingClientRect();
        const styles = window.getComputedStyle(container);
        
        // FORCER la visibilité si caché
        if (styles.display === 'none' || styles.visibility === 'hidden' || parseFloat(styles.opacity) < 0.1) {
          console.warn('⚠️ Container caché, force la visibilité !');
          container.style.cssText = `
            position: fixed !important;
            bottom: 24px !important;
            right: 24px !important;
            z-index: 999999 !important;
            visibility: visible !important;
            opacity: 1 !important;
            display: block !important;
            pointer-events: auto !important;
          `;
        }
      } else {
        console.error('❌ Container PAS trouvé dans le DOM !');
        // Si le container n'existe pas, c'est un problème sérieux
        // On va forcer sa création
        if (isMountedRef.current && document.getElementById('fab-container') === null) {
          console.warn('⚠️ Container complètement absent, recréation nécessaire');
        }
      }
      
      if (button) {
        const rect = button.getBoundingClientRect();
        const styles = window.getComputedStyle(button);
        
        // FORCER la visibilité si caché
        if (styles.display === 'none' || styles.visibility === 'hidden' || parseFloat(styles.opacity) < 0.1) {
          console.warn('⚠️ Bouton caché, force la visibilité !');
          button.style.cssText += `
            position: relative !important;
            visibility: visible !important;
            opacity: 1 !important;
            display: flex !important;
            pointer-events: auto !important;
            z-index: 999999 !important;
          `;
        }
      } else {
        console.error('❌ Bouton PAS trouvé dans le DOM !');
      }
    };
    
    // Vérifications multiples pour s'assurer que le bouton reste visible
    setTimeout(checkButton, 100);
    setTimeout(checkButton, 500);
    setTimeout(checkButton, 1000);
    setTimeout(checkButton, 2000);
    
    // Vérification périodique toutes les 2 secondes pour maintenir la visibilité
    const interval = setInterval(() => {
      if (isMountedRef.current) {
        checkButton();
      }
    }, 2000);
    
    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      id="fab-container"
      className="fab-container"
      style={{ 
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 999999,
        pointerEvents: 'auto',
        visibility: 'visible',
        opacity: 1,
        display: 'block'
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
            zIndex: 999999
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
              whiteSpace: 'nowrap'
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
              whiteSpace: 'nowrap'
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
          zIndex: 999999,
          outline: 'none',
          position: 'relative',
          visibility: 'visible',
          opacity: 1,
          pointerEvents: 'auto'
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
}
