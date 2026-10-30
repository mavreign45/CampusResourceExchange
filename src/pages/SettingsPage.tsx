import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  User,
  Shield,
  Award,
  Bell,
  Building,
  GraduationCap,
  LogOut,
  RefreshCw,
  Server,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { checkBackendHealth } from '../services/resourceService';
import { eligibilityService } from '../services/eligibilityService';
import { notificationService } from '../services/notificationService';
import { EligibilityRecord } from '../types/auth';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

interface SettingsPageProps {
  onOpenAuthModal: () => void;
  onNavigateToClearances: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  onOpenAuthModal,
  onNavigateToClearances,
}) => {
  const { user, isAuthenticated, logout } = useAuth();

  const [healthStatus, setHealthStatus] = useState<{ status: string; database: string } | null>(
    null
  );
  const [checkingHealth, setCheckingHealth] = useState(false);
  const [clearances, setClearances] = useState<EligibilityRecord[]>([]);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState<number>(0);
  const [clearingNotifs, setClearingNotifs] = useState(false);
  const [notifSuccessMsg, setNotifSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    checkHealth();
    if (isAuthenticated) {
      loadUserData();
    }
  }, [isAuthenticated]);

  const checkHealth = async () => {
    setCheckingHealth(true);
    try {
      const res = await checkBackendHealth();
      setHealthStatus(res);
    } catch {
      setHealthStatus({ status: 'unreachable', database: 'disconnected' });
    } finally {
      setCheckingHealth(false);
    }
  };

  const loadUserData = async () => {
    try {
      const [records, count] = await Promise.all([
        eligibilityService.getMyEligibility(),
        notificationService.getUnreadCount(),
      ]);
      setClearances(records);
      setUnreadNotifsCount(count);
    } catch {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    setClearingNotifs(true);
    setNotifSuccessMsg(null);
    try {
      const res = await notificationService.markAllAsRead();
      setUnreadNotifsCount(0);
      setNotifSuccessMsg(`Successfully cleared ${res.updated_count} notification(s).`);
    } catch {
      // ignore
    } finally {
      setClearingNotifs(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-8 sm:p-10 max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-cyan-50 border border-cyan-200 flex items-center justify-center mx-auto mb-4">
            <User className="w-7 h-7 text-cyan-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Sign In Required</h2>
          <p className="text-xs text-slate-500 mb-6">
            Please sign in with your university account to manage account settings and verified training credentials.
          </p>
          <Button variant="primary" size="sm" onClick={onOpenAuthModal}>
            Sign In to Campus Exchange
          </Button>
        </div>
      </div>
    );
  }

  const verifiedClearances = clearances.filter((c) => c.status === 'Verified');

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Settings Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white rounded-2xl border border-slate-200/90 shadow-subtle">
        <div>
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold mb-1">
            <SettingsIcon className="w-4 h-4 text-slate-600" />
            <span>Account &amp; System Configuration</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Settings &amp; Preferences
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your university identity, security permissions, training credentials, and system diagnostics.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={logout}
          className="text-rose-600 border-rose-200 hover:bg-rose-50 self-start sm:self-center"
          icon={<LogOut className="w-3.5 h-3.5" />}
        >
          Sign Out
        </Button>
      </div>

      {/* User Identity Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-navy-950 to-slate-800 text-cyan-400 font-extrabold flex items-center justify-center text-sm shadow-sm">
              {user?.full_name
                ?.split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase() || 'U'}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{user?.full_name}</h3>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
          </div>

          <Badge
            variant={
              user?.role === 'Admin'
                ? 'danger'
                : user?.role === 'Lab Custodian'
                ? 'warning'
                : 'success'
            }
            dot
            size="md"
          >
            {user?.role}
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-1.5 text-slate-400 font-semibold mb-1">
              <Building className="w-3.5 h-3.5" />
              <span>Department</span>
            </div>
            <p className="font-medium text-slate-800">
              {user?.department || 'University Academic Department'}
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-1.5 text-slate-400 font-semibold mb-1">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Campus ID</span>
            </div>
            <p className="font-mono font-medium text-slate-800">
              {user?.student_id || `UID-${user?.id}`}
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-1.5 text-slate-400 font-semibold mb-1">
              <Shield className="w-3.5 h-3.5" />
              <span>Account Status</span>
            </div>
            <p className="font-medium text-emerald-600 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span>Active &amp; Verified</span>
            </p>
          </div>
        </div>
      </div>

      {/* Verified Training Clearances */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-cyan-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Safety Clearances &amp; Training Badges ({verifiedClearances.length})
            </h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onNavigateToClearances}
            icon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            Manage Clearances
          </Button>
        </div>

        {verifiedClearances.length === 0 ? (
          <p className="text-xs text-slate-500 py-2">
            You do not currently have any verified training credentials. Submit documentation in My Clearances to unlock restricted equipment.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {verifiedClearances.map((c) => (
              <div
                key={c.id}
                className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-start justify-between"
              >
                <div>
                  <h4 className="font-bold text-slate-900">{c.requirement_type}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Verified {new Date(c.updated_at || c.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant="success" size="sm">
                  Verified
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notifications & System Diagnostics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* In-App Notifications */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-6 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-1">
              <Bell className="w-4 h-4 text-cyan-600" />
              <span>In-App Notifications</span>
            </div>
            <p className="text-xs text-slate-500">
              Current unread alerts: <strong className="text-slate-800">{unreadNotifsCount}</strong>
            </p>

            {notifSuccessMsg && (
              <p className="text-[11px] text-emerald-600 font-medium mt-2 bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                {notifSuccessMsg}
              </p>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            disabled={unreadNotifsCount === 0 || clearingNotifs}
            onClick={handleMarkAllRead}
            className="w-full text-xs"
          >
            {clearingNotifs ? 'Clearing...' : 'Mark All Notifications as Read'}
          </Button>
        </div>

        {/* Backend Diagnostics */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-6 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Server className="w-4 h-4 text-slate-600" />
                <span>Backend Platform Health</span>
              </div>
              <button
                type="button"
                onClick={checkHealth}
                disabled={checkingHealth}
                className="text-slate-400 hover:text-slate-600"
                title="Refresh health check"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${checkingHealth ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <div className="space-y-1.5 text-xs text-slate-500 pt-1">
              <div className="flex items-center justify-between">
                <span>FastAPI Service:</span>
                <span
                  className={`font-semibold ${
                    healthStatus?.status === 'healthy' ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {healthStatus?.status || 'checking...'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>PostgreSQL Relational DB:</span>
                <span
                  className={`font-semibold ${
                    healthStatus?.database === 'connected' ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {healthStatus?.database || 'checking...'}
                </span>
              </div>
            </div>
          </div>

          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-500">
            Platform: <strong>Campus Resource Exchange 2026</strong> • Production Ready
          </div>
        </div>
      </div>
    </div>
  );
};
