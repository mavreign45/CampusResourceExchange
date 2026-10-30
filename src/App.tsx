import { useState, useEffect } from 'react';
import { AppSidebar, NavigationPage } from './components/layout/AppSidebar';
import { AppHeader } from './components/layout/AppHeader';
import { MobileNavigation } from './components/layout/MobileNavigation';
import { DiscoverResources } from './pages/DiscoverResources';
import { EligibilityDashboard } from './pages/EligibilityDashboard';
import { VerificationReviewQueue } from './pages/VerificationReviewQueue';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { MyRequestsPage } from './pages/MyRequestsPage';
import { LabDashboardPage } from './pages/LabDashboardPage';
import { SettingsPage } from './pages/SettingsPage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { AuthModal } from './components/auth/AuthModal';
import { AuthProvider } from './context/AuthContext';
import { Resource } from './types/resource';
import { INITIAL_MOCK_RESOURCES } from './data/mockResources';

function AppContent() {
  const [currentPage, setCurrentPage] = useState<NavigationPage>('discover');
  const [resources, setResources] = useState<Resource[]>(INITIAL_MOCK_RESOURCES);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [reviewQueueTab, setReviewQueueTab] = useState<'reservations' | 'clearances'>('reservations');

  // Saved resources set persisted in localStorage
  const [savedResourceIds, setSavedResourceIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('cre_saved_resources');
      if (saved) {
        return new Set(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
    return new Set(['res-osc-01', 'res-cam-02']);
  });

  // Persist saved resources
  useEffect(() => {
    try {
      localStorage.setItem(
        'cre_saved_resources',
        JSON.stringify(Array.from(savedResourceIds))
      );
    } catch {
      // ignore
    }
  }, [savedResourceIds]);

  const handleToggleSave = (id: string) => {
    setSavedResourceIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleOpenAuth = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const savedResourcesList = resources.filter((r) => savedResourceIds.has(r.id));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 antialiased">
      <div className="flex flex-1 min-h-screen">
        {/* Desktop Sidebar */}
        <AppSidebar
          currentPage={currentPage}
          onNavigate={(page) => {
            setCurrentPage(page);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          savedCount={savedResourceIds.size}
          onOpenAuthModal={() => handleOpenAuth('login')}
          className="hidden lg:flex sticky top-0 h-screen"
        />

        {/* Mobile Slide-Over Navigation */}
        <MobileNavigation
          isOpen={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
          currentPage={currentPage}
          onNavigate={(page) => {
            setCurrentPage(page);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          savedCount={savedResourceIds.size}
          onOpenAuthModal={() => handleOpenAuth('login')}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Sticky App Header */}
          <AppHeader
            currentPage={currentPage}
            onOpenMobileMenu={() => setMobileNavOpen(true)}
            globalSearchQuery={globalSearchQuery}
            onGlobalSearchChange={(query) => {
              setGlobalSearchQuery(query);
              if (currentPage !== 'discover') {
                setCurrentPage('discover');
              }
            }}
            onOpenAuthModal={handleOpenAuth}
            onNavigate={(page) => {
              setCurrentPage(page);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />

          {/* Page Body */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {currentPage === 'discover' && (
              <DiscoverResources
                searchQuery={globalSearchQuery}
                onSearchQueryChange={setGlobalSearchQuery}
                savedResourceIds={savedResourceIds}
                onToggleSaveResource={handleToggleSave}
                onResourcesLoaded={(loaded) => setResources(loaded)}
                onOpenAuthModal={() => handleOpenAuth('login')}
              />
            )}

            {currentPage === 'clearances' && (
              <EligibilityDashboard
                onOpenAuthModal={() => handleOpenAuth('login')}
                onNavigateToDiscover={() => setCurrentPage('discover')}
              />
            )}

            {currentPage === 'review_queue' && (
              <VerificationReviewQueue initialTab={reviewQueueTab} />
            )}

            {currentPage === 'users' && <AdminUsersPage />}

            {(currentPage === 'requests' || currentPage === 'bookings') && (
              <MyRequestsPage
                onOpenAuthModal={() => handleOpenAuth('login')}
                onNavigateToDiscover={() => setCurrentPage('discover')}
              />
            )}

            {currentPage === 'dashboard' && (
              <LabDashboardPage
                onNavigateToReviewQueue={(tab) => {
                  setReviewQueueTab(tab || 'reservations');
                  setCurrentPage('review_queue');
                }}
                onNavigateToDiscover={() => setCurrentPage('discover')}
              />
            )}

            {currentPage === 'settings' && (
              <SettingsPage
                onOpenAuthModal={() => handleOpenAuth('login')}
                onNavigateToClearances={() => setCurrentPage('clearances')}
              />
            )}

            {currentPage === 'saved' && (
              <PlaceholderPage
                page="saved"
                onNavigateToDiscover={() => setCurrentPage('discover')}
                savedResources={savedResourcesList}
                savedResourceIds={savedResourceIds}
                onToggleSaveResource={handleToggleSave}
              />
            )}
          </main>

          {/* Clean App Footer */}
          <footer className="mt-auto border-t border-slate-200/80 bg-white py-4 px-6 text-center text-xs text-slate-400">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
              <p>
                <strong>Campus Resource Exchange</strong> — Unlock Resources. Empower Innovation.
              </p>
              <p className="text-[11px] text-slate-400">
                Enterprise Academic Platform • Equipment Reservations &amp; Custody Oversight Live
              </p>
            </div>
          </footer>
        </div>
      </div>

      {/* Global Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
      />
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
