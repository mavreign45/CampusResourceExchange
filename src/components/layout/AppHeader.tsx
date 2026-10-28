import React, { useState } from 'react';
import {
  Bell,
  Search,
  Menu,
  ChevronRight,
} from 'lucide-react';
import { NavigationPage } from './AppSidebar';

interface AppHeaderProps {
  currentPage: NavigationPage;
  onOpenMobileMenu: () => void;
  globalSearchQuery: string;
  onGlobalSearchChange: (query: string) => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  currentPage,
  onOpenMobileMenu,
  globalSearchQuery,
  onGlobalSearchChange,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);

  const getPageInfo = () => {
    switch (currentPage) {
      case 'discover':
        return {
          title: 'Discover Resources',
          breadcrumb: 'Campus Equipment & Space Catalog',
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

      {/* Right: Notifications & Profile */}
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
                <span className="text-[10px] text-slate-400">1 new notice</span>
              </div>
              <div className="py-3 space-y-2.5">
                <div className="p-2.5 bg-campus-50/70 rounded-lg border border-campus-100">
                  <div className="flex items-center justify-between text-campus-900 font-semibold text-[11px]">
                    <span>Welcome to Phase 1</span>
                    <span className="text-[9px] text-campus-600">Just now</span>
                  </div>
                  <p className="text-slate-600 text-[11px] mt-1 leading-normal">
                    Explore available equipment across campus labs. Booking workflows will arrive in Phase 2 & 4.
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

        {/* User Avatar & Badge */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-navy-900 text-white flex items-center justify-center font-bold text-xs shadow-xs ring-1 ring-slate-200">
            AC
          </div>
          <div className="hidden xl:block text-left">
            <span className="text-xs font-bold text-slate-900 block leading-tight">
              Alex Chen
            </span>
            <span className="text-[10px] text-slate-400 block font-medium">
              Student ID: #82049
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
