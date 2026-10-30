import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  CheckCheck,
  Check,
  RefreshCw,
  AlertCircle,
  Inbox,
  Calendar,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { NavigationPage } from './AppSidebar';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { notificationService } from '../../services/notificationService';
import { AppNotification } from '../../types/notification';

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
  const notifRef = useRef<HTMLDivElement>(null);

  // Notifications state
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState<boolean>(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch {
      // Silently ignore background poll errors
    }
  }, [isAuthenticated]);

  // Fetch notifications list
  const fetchNotificationsList = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoadingNotifications(true);
    setNotificationsError(null);
    try {
      const res = await notificationService.getNotifications({ page: 1, page_size: 15 });
      setNotifications(res.items);
      setUnreadCount(res.unread_count);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load notifications.';
      setNotificationsError(msg);
    } finally {
      setLoadingNotifications(false);
    }
  }, [isAuthenticated]);

  // Initial and periodic unread count poll
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // When notification tray opens, fetch full list
  useEffect(() => {
    if (showNotifications && isAuthenticated) {
      fetchNotificationsList();
    }
  }, [showNotifications, isAuthenticated, fetchNotificationsList]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (profileMenuRef.current && !profileMenuRef.current.contains(target)) {
        setShowProfileMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(target)) {
        setShowNotifications(false);
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
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors relative"
            aria-label="View notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 ? (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-cyan-600 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            ) : null}
          </button>

          {showNotifications && (
            <div
              className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 text-xs overflow-hidden animate-in fade-in slide-in-from-top-1"
              role="dialog"
            >
              {/* Header */}
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-cyan-100 text-cyan-800 text-[10px] font-semibold">
                      {unreadCount} new
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {isAuthenticated && unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await notificationService.markAllAsRead();
                          setNotifications((prev) =>
                            prev.map((n) => ({ ...n, is_read: true }))
                          );
                          setUnreadCount(0);
                        } catch {
                          // ignore
                        }
                      }}
                      className="text-[11px] text-cyan-700 hover:text-cyan-900 font-semibold flex items-center gap-1"
                      title="Mark all as read"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Mark all read</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowNotifications(false)}
                    className="text-slate-400 hover:text-slate-600 text-sm ml-1"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
                {!isAuthenticated ? (
                  <div className="p-6 text-center space-y-2">
                    <Inbox className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="font-medium text-slate-700">Sign in to view notifications</p>
                    <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                      Receive live updates on your reservation requests, pickup windows, and safety clearances.
                    </p>
                    {onOpenAuthModal && (
                      <Button
                        variant="primary"
                        size="sm"
                        className="bg-navy-900 text-white mt-2"
                        onClick={() => {
                          setShowNotifications(false);
                          onOpenAuthModal('login');
                        }}
                      >
                        Sign In
                      </Button>
                    )}
                  </div>
                ) : loadingNotifications ? (
                  <div className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 text-cyan-600 animate-spin mx-auto mb-2" />
                    <span>Loading notifications...</span>
                  </div>
                ) : notificationsError ? (
                  <div className="p-4 text-center space-y-2">
                    <AlertCircle className="w-6 h-6 text-rose-500 mx-auto" />
                    <p className="text-slate-700">{notificationsError}</p>
                    <button
                      type="button"
                      onClick={fetchNotificationsList}
                      className="text-xs text-cyan-700 underline font-medium"
                    >
                      Retry
                    </button>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="py-12 px-4 text-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
                      <Inbox className="w-5 h-5" />
                    </div>
                    <p className="font-bold text-slate-700 text-xs">All caught up!</p>
                    <p className="text-[11px] text-slate-400">
                      You have no notifications right now.
                    </p>
                  </div>
                ) : (
                  notifications.map((n) => {
                    const isUnread = !n.is_read;

                    const handleItemClick = async () => {
                      if (isUnread) {
                        try {
                          await notificationService.markAsRead(n.id);
                          setNotifications((prev) =>
                            prev.map((item) =>
                              item.id === n.id ? { ...item, is_read: true } : item
                            )
                          );
                          setUnreadCount((c) => Math.max(0, c - 1));
                        } catch {
                          // ignore
                        }
                      }

                      // Navigation
                      if (n.entity_type === 'reservation') {
                        const isReviewer = user?.role === 'Lab Custodian' || user?.role === 'Admin';
                        if (isReviewer && n.notification_type === 'reservation_submitted') {
                          onNavigate?.('review_queue');
                        } else {
                          onNavigate?.('requests');
                        }
                        setShowNotifications(false);
                      } else if (n.entity_type === 'eligibility') {
                        const isReviewer = user?.role === 'Lab Custodian' || user?.role === 'Admin';
                        if (isReviewer && n.notification_type === 'eligibility_submitted') {
                          onNavigate?.('review_queue');
                        } else {
                          onNavigate?.('clearances');
                        }
                        setShowNotifications(false);
                      }
                    };

                    const handleQuickMarkRead = async (e: React.MouseEvent) => {
                      e.stopPropagation();
                      try {
                        await notificationService.markAsRead(n.id);
                        setNotifications((prev) =>
                          prev.map((item) =>
                            item.id === n.id ? { ...item, is_read: true } : item
                          )
                        );
                        setUnreadCount((c) => Math.max(0, c - 1));
                      } catch {
                        // ignore
                      }
                    };

                    // Choose icon
                    let icon = <Calendar className="w-4 h-4 text-cyan-600" />;
                    if (n.entity_type === 'eligibility') {
                      icon = <ShieldCheck className="w-4 h-4 text-emerald-600" />;
                    } else if (
                      n.notification_type === 'pickup_reminder' ||
                      n.notification_type === 'return_reminder' ||
                      n.notification_type === 'reservation_overdue'
                    ) {
                      icon = <Clock className="w-4 h-4 text-amber-600" />;
                    } else if (
                      n.notification_type === 'reservation_rejected' ||
                      n.notification_type === 'reservation_cancelled' ||
                      n.notification_type === 'reservation_expired'
                    ) {
                      icon = <AlertCircle className="w-4 h-4 text-rose-500" />;
                    }

                    return (
                      <div
                        key={n.id}
                        onClick={handleItemClick}
                        className={`p-3.5 transition-colors cursor-pointer group flex items-start gap-3 ${
                          isUnread
                            ? 'bg-cyan-50/40 hover:bg-cyan-50/70 border-l-2 border-cyan-500'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="shrink-0 mt-0.5">{icon}</div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span
                              className={`text-xs block truncate ${
                                isUnread ? 'font-bold text-slate-900' : 'font-medium text-slate-700'
                              }`}
                            >
                              {n.title}
                            </span>
                            <span className="text-[10px] text-slate-400 shrink-0">
                              {new Date(n.created_at).toLocaleTimeString([], {
                                hour: 'numeric',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-600 mt-0.5 leading-snug line-clamp-2">
                            {n.message}
                          </p>

                          <div className="mt-1 flex items-center justify-between">
                            <span className="text-[10px] text-slate-400">
                              {new Date(n.created_at).toLocaleDateString([], {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                            {isUnread && (
                              <button
                                type="button"
                                onClick={handleQuickMarkRead}
                                className="text-[10px] text-cyan-700 hover:text-cyan-900 font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5"
                                title="Mark read"
                              >
                                <Check className="w-3 h-3" />
                                <span>Mark read</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              {isAuthenticated && notifications.length > 0 && (
                <div className="p-2 border-t border-slate-100 bg-slate-50 text-center">
                  <button
                    type="button"
                    onClick={fetchNotificationsList}
                    className="text-[11px] text-slate-500 hover:text-slate-800 font-medium inline-flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Refresh alerts</span>
                  </button>
                </div>
              )}
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
