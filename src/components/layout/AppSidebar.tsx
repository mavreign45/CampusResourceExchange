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
  Award,
  Users,
  LogIn,
  CheckSquare,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export type NavigationPage =
  | 'discover'
  | 'clearances'
  | 'review_queue'
  | 'users'
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
  onOpenAuthModal?: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  currentPage,
  onNavigate,
  savedCount = 0,
  className = '',
  onCloseMobile,
  onOpenAuthModal,
}) => {
  const { user, isAuthenticated } = useAuth();

  const isReviewer = user?.role === 'Lab Custodian' || user?.role === 'Admin';
  const isAdmin = user?.role === 'Admin';

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
      id: 'clearances' as NavigationPage,
      label: 'My Clearances',
      icon: <Award className="w-4 h-4" />,
      badge: 'Active',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
      isUpcoming: false,
      visible: true,
    },
    ...(isReviewer
      ? [
          {
            id: 'review_queue' as NavigationPage,
            label: 'Review Queue',
            icon: <CheckSquare className="w-4 h-4" />,
            badge: 'RBAC',
            badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
            isUpcoming: false,
            visible: true,
          },
        ]
      : []),
    ...(isAdmin
      ? [
          {
            id: 'users' as NavigationPage,
            label: 'User Management',
            icon: <Users className="w-4 h-4" />,
            badge: 'Admin',
            badgeColor: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
            isUpcoming: false,
            visible: true,
          },
        ]
      : []),
    {
      id: 'saved' as NavigationPage,
      label: 'Saved Resources',
      icon: <Bookmark className="w-4 h-4" />,
      badge: savedCount > 0 ? `${savedCount}` : undefined,
      badgeColor: 'bg-campus-500/20 text-cyan-300 border border-cyan-500/30',
      isUpcoming: false,
      visible: true,
    },
    {
      id: 'requests' as NavigationPage,
      label: 'My Requests',
      icon: <FileClock className="w-4 h-4" />,
      badge: undefined,
      badgeColor: '',
      isUpcoming: false,
      visible: true,
    },
    {
      id: 'bookings' as NavigationPage,
      label: 'My Bookings',
      icon: <CalendarCheck className="w-4 h-4" />,
      badge: undefined,
      badgeColor: '',
      isUpcoming: false,
      visible: true,
    },
    {
      id: 'dashboard' as NavigationPage,
      label: 'Lab Dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
      badge: undefined,
      badgeColor: '',
      isUpcoming: true,
      visible: true,
    },
    {
      id: 'settings' as NavigationPage,
      label: 'Settings',
      icon: <Settings className="w-4 h-4" />,
      badge: undefined,
      badgeColor: '',
      isUpcoming: false,
      visible: true,
    },
  ];

  const handleItemClick = (page: NavigationPage) => {
    onNavigate(page);
    if (onCloseMobile) onCloseMobile();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
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

        {navItems
          .filter((item) => item.visible !== false)
          .map((item) => {
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

      {/* Platform Status footer */}
      <div className="p-3.5 border-t border-slate-800/80 m-3 bg-slate-900/60 rounded-xl border border-slate-800">
        <div className="flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <span className="text-xs font-semibold text-slate-200 block">
              Campus Exchange Platform
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
              JWT Authentication & Training Verification active.
            </p>
          </div>
        </div>
      </div>

      {/* User profile / Auth status footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-900/40">
        {isAuthenticated && user ? (
          <div className="flex items-center gap-3 px-2 py-1.5">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-700 to-navy-800 border border-cyan-500/40 flex items-center justify-center text-xs font-bold text-white shadow-xs">
                {getInitials(user.full_name)}
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-navy-950" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-200 truncate">
                  {user.full_name}
                </span>
                <span className="text-[9px] px-1 rounded bg-slate-800 text-cyan-300 font-mono border border-slate-700">
                  {user.role}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                {user.department || user.email}
              </p>
            </div>
          </div>
        ) : (
          <div className="px-2 py-1.5 flex items-center justify-between gap-2">
            <div>
              <span className="text-xs font-semibold text-slate-300 block">
                Guest Explorer
              </span>
              <span className="text-[10px] text-slate-400 block">
                Browsing public catalog
              </span>
            </div>
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-campus-600/30 text-cyan-300 hover:bg-campus-600/50 transition-colors border border-cyan-500/30 font-medium"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
