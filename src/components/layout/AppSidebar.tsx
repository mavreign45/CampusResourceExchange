import React from 'react';
import {
  Compass,
  FileClock,
  CalendarCheck,
  Bookmark,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Layers,
} from 'lucide-react';

export type NavigationPage =
  | 'discover'
  | 'requests'
  | 'bookings'
  | 'saved'
  | 'dashboard'
  | 'settings';

interface AppSidebarProps {
  currentPage: NavigationPage;
  onNavigate: (page: NavigationPage) => void;
  savedCount?: number;
  className?: string;
  onCloseMobile?: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  currentPage,
  onNavigate,
  savedCount = 0,
  className = '',
  onCloseMobile,
}) => {
  const navItems = [
    {
      id: 'discover' as NavigationPage,
      label: 'Discover Resources',
      icon: <Compass className="w-4 h-4" />,
      badge: 'Live',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
      isUpcoming: false,
    },
    {
      id: 'requests' as NavigationPage,
      label: 'My Requests',
      icon: <FileClock className="w-4 h-4" />,
      badge: 'Phase 4',
      badgeColor: 'bg-slate-800 text-slate-400 border border-slate-700/60',
      isUpcoming: true,
    },
    {
      id: 'bookings' as NavigationPage,
      label: 'My Bookings',
      icon: <CalendarCheck className="w-4 h-4" />,
      badge: 'Phase 4',
      badgeColor: 'bg-slate-800 text-slate-400 border border-slate-700/60',
      isUpcoming: true,
    },
    {
      id: 'saved' as NavigationPage,
      label: 'Saved Resources',
      icon: <Bookmark className="w-4 h-4" />,
      badge: savedCount > 0 ? `${savedCount}` : undefined,
      badgeColor: 'bg-campus-500/20 text-cyan-300 border border-cyan-500/30',
      isUpcoming: false,
    },
    {
      id: 'dashboard' as NavigationPage,
      label: 'Lab Dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
      badge: 'Phase 6',
      badgeColor: 'bg-slate-800 text-slate-400 border border-slate-700/60',
      isUpcoming: true,
    },
    {
      id: 'settings' as NavigationPage,
      label: 'Settings',
      icon: <Settings className="w-4 h-4" />,
      badge: 'Phase 3',
      badgeColor: 'bg-slate-800 text-slate-400 border border-slate-700/60',
      isUpcoming: true,
    },
  ];

  const handleItemClick = (page: NavigationPage) => {
    onNavigate(page);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <aside
      className={`flex flex-col bg-navy-950 text-slate-300 border-r border-slate-800/80 w-64 select-none shrink-0 ${className}`}
    >
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-campus-600 via-cyan-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-cyan-950/50 shrink-0">
            <Layers className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold tracking-tight text-white leading-tight">
              Campus Resource Exchange
            </h1>
            <span className="text-[10px] text-cyan-400 font-medium tracking-wide flex items-center gap-1 mt-0.5">
              <span>Fair & Trusted Sharing</span>
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Section */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Main Navigation
        </div>

        {navItems.map((item) => {
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleItemClick(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                isActive
                  ? 'bg-campus-600/15 text-cyan-300 font-semibold border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={`${
                    isActive
                      ? 'text-cyan-400'
                      : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                >
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium shrink-0 ml-1.5 ${item.badgeColor}`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Trust & Policy Badge footer */}
      <div className="p-4 border-t border-slate-800/80 m-3 bg-slate-900/60 rounded-xl border">
        <div className="flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <span className="text-xs font-semibold text-slate-200 block">
              Phase 1 Live Prototype
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
              Discovery mode active with simulated resource catalog.
            </p>
          </div>
        </div>
      </div>

      {/* User profile footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-900/40">
        <div className="flex items-center gap-3 px-2 py-1.5">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-700 to-slate-600 border border-slate-600 flex items-center justify-center text-xs font-bold text-white">
              AC
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-navy-950" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-200 truncate">
                Alex Chen
              </span>
              <span className="text-[9px] px-1 rounded bg-slate-800 text-slate-400 font-mono">
                Student
              </span>
            </div>
            <p className="text-[11px] text-slate-500 truncate">
              Dept. of Computer Science
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};
