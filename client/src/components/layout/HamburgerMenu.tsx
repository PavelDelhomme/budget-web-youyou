interface HamburgerMenuProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function HamburgerMenu({ isOpen, onToggle }: HamburgerMenuProps) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className="fixed top-4 left-4 z-[100] p-3 rounded-lg bg-blue-600 dark:bg-blue-500 text-white shadow-xl hover:bg-blue-700 dark:hover:bg-blue-600 transition-all duration-200 lg:hidden focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
      aria-label={isOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
      aria-expanded={isOpen}
      style={{ zIndex: 100 }}
    >
      <svg
        className="w-6 h-6 text-white"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.5"
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

