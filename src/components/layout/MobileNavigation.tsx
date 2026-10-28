import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { AppSidebar, NavigationPage } from './AppSidebar';

interface MobileNavigationProps {
  isOpen: boolean;
  onClose: () => void;
  currentPage: NavigationPage;
  onNavigate: (page: NavigationPage) => void;
  savedCount: number;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  isOpen,
  onClose,
  currentPage,
  onNavigate,
  savedCount,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 max-w-xs w-full flex flex-col z-50">
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-navy-950">
          <div className="absolute top-2 right-2 z-10">
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <AppSidebar
            currentPage={currentPage}
            onNavigate={onNavigate}
            savedCount={savedCount}
            onCloseMobile={onClose}
            className="w-full h-full border-r-0"
          />
        </div>
      </div>
    </div>
  );
};
