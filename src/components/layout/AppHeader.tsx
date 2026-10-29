import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  Search,
  Menu,
  ChevronRight,
  ChevronDown,
  LogOut,
  Award,
  CheckSquare,
  Users,
  LogIn,
  UserPlus,
} from 'lucide-react';
import { NavigationPage } from './AppSidebar';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';

interface AppHeaderProps {
  currentPage: NavigationPage;
  onOpenMobileMenu: () => void;
  globalSearchQuery: string;
  onGlobalSearchChange: (query: string) => void;
  onOpenAuthModal?: (mode?: 'login' | 'register') => void;
  onNavigate?: (page: NavigationPage) => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  currentPage,
  onOpenMobileMenu,
  globalSearchQuery,
  onGlobalSearchChange,
  onOpenAuthModal,
  onNavigate,
}) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(e.target as Node)
      ) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const getPageInfo = () => {
    switch (currentPage) {
      case 'discover':
        return {
          title: 'Discover Resources',
          breadcrumb: 'Campus Equipment & Space Catalog',
        };
      case 'clearances':
        return {
          title: 'My Training Clearances',
          breadcrumb: 'Verified Safety & Equipment Certifications',
        };
      case 'review_queue':
        return {
          title: 'Verification Review Queue',
          breadcrumb: 'Custodian & Admin Clearance Oversight',
        };
      case 'users':
        return {
          title: 'User Management',
          breadcrumb: 'Campus Roles & Permissions (RBAC)',
        };
      case 'requests':
        return {
          title: 'My Access Requests',
          breadcrumb: 'Approval Workflow Status',
        };
      case 'bookings':
        return {
          title: 'My Active Bookings',
          breadcrumb: 'Handover & Return Schedule',
        };
      case 'saved':
        return {
          title: 'Saved Resources',
          breadcrumb: 'Bookmarked Equipment for Quick Access',
        };
      case 'dashboard':
        return {
          title: 'Lab Custodian Dashboard',
          breadcrumb: 'Equipment Utilization & Oversight',
        };
      case 'settings':
        return {
          title: 'Account & Department Settings',
          breadcrumb: 'Preferences & Training Certifications',
        };
      default:
        return {
          title: 'Campus Resource Exchange',
          breadcrumb: 'Resource Hub',
        };
    }
  };

  const pageInfo = getPageInfo();

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const isReviewer = user?.role === 'Lab Custodian' || user?.role === 'Admin';
  const isAdmin = user?.role === 'Admin';

  const handleDropdownNavigate = (page: NavigationPage) => {
    setShowProfileMenu(false);
    if (onNavigate) onNavigate(page);
  };

  const handleSignOut = async () => {
    setShowProfileMenu(false);
    await logout();
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-xs">
      {/* Left: Mobile Menu Toggle + Contextual Page Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="Open mobile navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className="font-medium text-slate-600">Exchange</span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-slate-500 font-medium hidden sm:inline">
              {pageInfo.breadcrumb}
            </span>
          </div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
            {pageInfo.title}
          </h2>
        </div>
      </div>

      {/* Middle: Quick Search Input in header */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={globalSearchQuery}
            onChange={(e) => onGlobalSearchChange(e.target.value)}
            placeholder="Quick search campus resources..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-campus-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Right: Notifications & Profile / Sign In */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Notifications Popover */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors relative"
            aria-label="View notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-500 ring-2 ring-white" />
          </button>

          {showNotifications && (
            <div
              className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-4 z-50 text-xs animate-in fade-in slide-in-from-top-1"
              role="dialog"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-bold text-slate-900">Campus Alerts</span>
                <span className="text-[10px] text-cyan-600 font-semibold">Phase 3 Active</span>
              </div>
              <div className="py-3 space-y-2.5">
                <div className="p-2.5 bg-campus-50/70 rounded-lg border border-campus-100">
                  <div className="flex items-center justify-between text-campus-900 font-semibold text-[11px]">
                    <span>Authentication & RBAC Live</span>
                    <span className="text-[9px] text-campus-600">Phase 3</span>
                  </div>
                  <p className="text-slate-600 text-[11px] mt-1 leading-normal">
                    User registration, JWT logins, and lab training clearances are now fully operational.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNotifications(false)}
                className="w-full py-1 text-center text-slate-400 hover:text-slate-700 text-[11px]"
              >
                Close notification tray
              </button>
            </div>
          )}
        </div>

        {/* Profile / Auth Area */}
        {isAuthenticated && user ? (
          <div className="relative" ref={profileMenuRef}>
            <button
              type="button"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2.5 pl-2 border-l border-slate-200 hover:opacity-90 transition-opacity"
            >
              <div className="w-8 h-8 rounded-full bg-navy-900 text-white flex items-center justify-center font-bold text-xs shadow-xs ring-1 ring-slate-200">
                {getInitials(user.full_name)}
              </div>
              <div className="hidden xl:block text-left">
                <span className="text-xs font-bold text-slate-900 block leading-tight">
                  {user.full_name}
                </span>
                <span className="text-[10px] text-cyan-700 block font-medium">
                  {user.role}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden xl:block" />
            </button>

            {/* Profile Dropdown */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 text-xs animate-in fade-in slide-in-from-top-1">
                <div className="px-4 py-2 border-b border-slate-100">
                  <span className="font-bold text-slate-900 block truncate">
                    {user.full_name}
                  </span>
                  <span className="text-[11px] text-slate-400 block truncate">
                    {user.email}
                  </span>
                  <div className="mt-1">
                    <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      Role: {user.role}
                    </span>
                  </div>
                </div>

                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => handleDropdownNavigate('clearances')}
                    className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center gap-2.5 text-slate-700 font-medium"
                  >
                    <Award className="w-4 h-4 text-cyan-600" />
                    <span>My Clearances</span>
                  </button>

                  {isReviewer && (
                    <button
                      type="button"
                      onClick={() => handleDropdownNavigate('review_queue')}
                      className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center gap-2.5 text-slate-700 font-medium"
                    >
                      <CheckSquare className="w-4 h-4 text-amber-600" />
                      <span>Reviewer Queue</span>
                    </button>
                  )}

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => handleDropdownNavigate('users')}
                      className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center gap-2.5 text-slate-700 font-medium"
                    >
                      <Users className="w-4 h-4 text-rose-600" />
                      <span>User Management</span>
                    </button>
                  )}
                </div>

                <div className="pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full px-4 py-2 text-left hover:bg-rose-50 flex items-center gap-2.5 text-rose-600 font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenAuthModal && onOpenAuthModal('login')}
              icon={<LogIn className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              Sign In
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onOpenAuthModal && onOpenAuthModal('register')}
              icon={<UserPlus className="w-3.5 h-3.5 text-cyan-400" />}
              className="bg-navy-900 hover:bg-slate-800 text-white text-xs hidden sm:inline-flex"
            >
              Register
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};
