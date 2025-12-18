import React, { useEffect, useRef } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  title: string;
  children: React.ReactNode;
  closeable?: boolean; // Si false, ne peut pas être fermé
  fullScreen?: boolean; // Si true, modal en plein écran
}

export function Modal({ isOpen, onClose, title, children, closeable = true, fullScreen = false }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape key (only if closeable)
  useEffect(() => {
    if (!closeable || !onClose) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open - plus strict pour fullScreen
      document.body.style.overflow = 'hidden';
      document.body.style.position = fullScreen ? 'fixed' : 'relative';
      document.body.style.width = fullScreen ? '100%' : 'auto';
      document.body.style.height = fullScreen ? '100%' : 'auto';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
      document.body.style.position = 'unset';
      document.body.style.width = 'unset';
      document.body.style.height = 'unset';
    };
  }, [isOpen, onClose, closeable, fullScreen]);

  // Focus management
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const firstInput = modalRef.current.querySelector('input, button') as HTMLElement;
      firstInput?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center ${fullScreen ? 'p-0' : 'p-4'} bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70`}
      onClick={closeable && onClose ? onClose : undefined}
      onKeyDown={(e) => {
        if (!closeable && e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      onWheel={(e) => {
        // Empêcher le scroll de l'arrière-plan même si on scroll dans le modal
        if (fullScreen) {
          e.stopPropagation();
        }
      }}
      onTouchMove={(e) => {
        // Empêcher le scroll tactile de l'arrière-plan
        if (fullScreen) {
          e.stopPropagation();
        }
      }}
      style={{ touchAction: fullScreen ? 'none' : 'auto' }}
    >
      <div
        ref={modalRef}
        className={`bg-white dark:bg-gray-800 ${fullScreen ? 'rounded-none w-full h-full max-w-full max-h-full' : 'rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh]'} overflow-y-auto ${fullScreen ? 'p-4 sm:p-6 md:p-8' : 'p-6'} space-y-4 border border-gray-200 dark:border-gray-700`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
          {closeable && onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="Fermer"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}

