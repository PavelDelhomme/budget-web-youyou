import { ReactNode, useEffect, useRef, useState } from 'react';

interface LazySectionProps {
  children: ReactNode;
  fallback?: ReactNode;
  rootMargin?: string;
  threshold?: number;
  minHeight?: string;
  className?: string;
}

/**
 * Composant qui charge son contenu uniquement quand il devient visible dans le viewport
 * Utilise Intersection Observer pour détecter la visibilité
 */
export function LazySection({
  children,
  fallback,
  rootMargin = '50px', // Commence à charger seulement 50px avant d'être visible (plus progressif)
  threshold = 0.01, // Moins strict : déclenche dès qu'un pixel est visible
  minHeight = '200px',
  className = '',
}: LazySectionProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Délai pour éviter que tout charge en même temps
    const loadDelay = Math.random() * 100; // 0-100ms de délai aléatoire par section

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasLoaded) {
            // Petit délai pour étaler le chargement
            setTimeout(() => {
              setIsVisible(true);
              setHasLoaded(true);
              // Une fois chargé, on peut arrêter d'observer
              if (sectionRef.current) {
                observer.unobserve(sectionRef.current);
              }
            }, loadDelay);
          }
        });
      },
      {
        rootMargin,
        threshold,
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, [rootMargin, threshold, hasLoaded]);

  return (
    <div
      ref={sectionRef}
      className={className}
      style={{
        minHeight: !hasLoaded ? minHeight : 'auto',
      }}
    >
      {hasLoaded ? (
        children
      ) : (
        fallback || (
          <div className="flex items-center justify-center w-full h-full min-h-[200px]">
            <div className="animate-pulse flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Chargement...</p>
            </div>
          </div>
        )
      )}
    </div>
  );
}

