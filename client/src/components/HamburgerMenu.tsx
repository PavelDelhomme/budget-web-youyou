interface HamburgerMenuProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function HamburgerMenu({ isOpen, onToggle }: HamburgerMenuProps) {
  return (
    <button
      onClick={onToggle}
      className="fixed top-4 left-4 z-[60] p-3 rounded-lg bg-blue-600 dark:bg-blue-500 text-white shadow-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
      aria-label={isOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
      aria-expanded={isOpen}
      style={{ zIndex: 60 }}
    >
      <svg
        className="w-6 h-6 text-gray-700 dark:text-gray-300"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        {isOpen ? (
          // Icône X (fermer)
          <path d="M6 18L18 6M6 6l12 12" />
        ) : (
          // Icône hamburger (ouvrir)
          <path d="M4 6h16M4 12h16M4 18h16" />
        )}
      </svg>
    </button>
  );
}

