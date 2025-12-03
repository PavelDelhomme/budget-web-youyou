import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface FloatingActionButtonProps {
  onAddExpense: () => void;
  onAddIncome: () => void;
}

export function FloatingActionButton({ onAddExpense, onAddIncome }: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  // Créer le container directement dans le body avec Portal
  useEffect(() => {
    console.log('🔧 FloatingActionButton useEffect - Montage...');
    
    // Nettoyer l'ancien container s'il existe (pour éviter les doublons)
    const existingContainer = document.getElementById('fab-portal-container');
    if (existingContainer) {
      console.log('🧹 Nettoyage ancien container...');
      existingContainer.remove();
    }
    
    // Créer un nouveau container
    const container = document.createElement('div');
    container.id = 'fab-portal-container';
    container.style.cssText = `
      position: fixed !important;
      bottom: 24px !important;
      right: 24px !important;
      z-index: 999999 !important;
      pointer-events: none !important;
    `;
    document.body.appendChild(container);
    
    containerRef.current = container;
    setIsMounted(true);
    
    console.log('✅ FloatingActionButton Portal créé !', container);
    
    return () => {
      console.log('🧹 FloatingActionButton démontage...');
      setIsMounted(false);
      // Ne PAS supprimer le container ici, car React peut re-render rapidement
      // On le nettoiera au prochain montage
    };
  }, []); // Dépendances vides = montage une seule fois

  // Vérification périodique de visibilité et forcer le re-render si nécessaire
  useEffect(() => {
    if (!isMounted) {
      console.warn('⚠️ Composant non monté, tentative de remontage...');
      // Forcer le remontage
      const container = document.getElementById('fab-portal-container');
      if (container && !containerRef.current) {
        containerRef.current = container;
        setIsMounted(true);
      }
      return;
    }
    
    const checkVisibility = () => {
      const container = containerRef.current;
      const button = buttonRef.current;
      
      if (!container) {
        console.error('❌ Container manquant, recréation...');
        // Recréer le container
        const newContainer = document.createElement('div');
        newContainer.id = 'fab-portal-container';
        newContainer.style.cssText = `
          position: fixed !important;
          bottom: 24px !important;
          right: 24px !important;
          z-index: 999999 !important;
          pointer-events: none !important;
        `;
        document.body.appendChild(newContainer);
        containerRef.current = newContainer;
        return;
      }
      
      const rect = container.getBoundingClientRect();
      const styles = window.getComputedStyle(container);
      
      // Vérifier si le container est visible
      const isVisible = rect.width > 0 && rect.height > 0 && 
                       styles.display !== 'none' && 
                       styles.visibility !== 'hidden' &&
                       parseFloat(styles.opacity) > 0.1;
      
      if (!isVisible) {
        console.warn('⚠️ Container non visible, force la visibilité !', {
          rect: { width: rect.width, height: rect.height },
          display: styles.display,
          visibility: styles.visibility,
          opacity: styles.opacity
        });
        container.style.pointerEvents = 'auto';
        container.style.display = 'block';
        container.style.visibility = 'visible';
        container.style.opacity = '1';
      }
      
      if (button) {
        const buttonRect = button.getBoundingClientRect();
        const buttonStyles = window.getComputedStyle(button);
        
        if (buttonRect.width === 0 || buttonRect.height === 0) {
          console.warn('⚠️ Bouton a une taille 0, force les dimensions !');
          button.style.width = '64px';
          button.style.height = '64px';
          button.style.display = 'flex';
        }
      } else {
        console.warn('⚠️ Bouton non trouvé dans le DOM');
      }
    };
    
    // Vérifications immédiates
    setTimeout(checkVisibility, 50);
    setTimeout(checkVisibility, 200);
    setTimeout(checkVisibility, 500);
    setTimeout(checkVisibility, 1000);
    
    // Vérification périodique
    const interval = setInterval(checkVisibility, 2000);
    
    return () => clearInterval(interval);
  }, [isMounted]);

  // Si pas encore monté, ne rien rendre
  if (!isMounted || !containerRef.current) {
    console.log('⏳ FloatingActionButton en attente de montage...');
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
