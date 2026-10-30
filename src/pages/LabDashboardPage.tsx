import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Package,
  Layers,
  Play,
  RefreshCw,
  Award,
  ArrowRight,
  ShieldAlert,
  Calendar,
  User,
  CheckCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchResourceSummary } from '../services/resourceService';
import { reservationService } from '../services/reservationService';
import { eligibilityService } from '../services/eligibilityService';
import { notificationService } from '../services/notificationService';
import { ResourceSummaryStats } from '../types/resource';
import { Reservation } from '../types/reservation';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

interface LabDashboardPageProps {
  onNavigateToReviewQueue: (tab?: 'reservations' | 'clearances') => void;
  onNavigateToDiscover: () => void;
}

export const LabDashboardPage: React.FC<LabDashboardPageProps> = ({
  onNavigateToReviewQueue,
  onNavigateToDiscover,
}) => {
  const { user, isAuthenticated } = useAuth();

  const [stats, setStats] = useState<ResourceSummaryStats | null>(null);
  const [activeLoans, setActiveLoans] = useState<Reservation[]>([]);
  const [pendingRequestsCount, setPendingRequestsCount] = useState<number>(0);
  const [pendingClearancesCount, setPendingClearancesCount] = useState<number>(0);
  const [overdueCount, setOverdueCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Automation runner state
  const [runningAutomation, setRunningAutomation] = useState<boolean>(false);
  const [automationResult, setAutomationResult] = useState<{
    timestamp: string;
    pickup_reminders_sent: number;
    return_reminders_sent: number;
    overdue_marked: number;
    expired_uncollected_cancelled: number;
  } | null>(null);
  const [automationError, setAutomationError] = useState<string | null>(null);

  // Action state on loans
  const [loanActionInProgress, setLoanActionInProgress] = useState<number | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const canAccess = user?.role === 'Lab Custodian' || user?.role === 'Admin';

  const loadDashboardData = useCallback(async () => {
    if (!isAuthenticated || !canAccess) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [summaryData, pendingRes, collectedRes, overdueRes, clearances] =
        await Promise.allSettled([
          fetchResourceSummary(),
          reservationService.getReviewQueue('Pending'),
          reservationService.getReviewQueue('Collected'),
          reservationService.getReviewQueue('Overdue'),
          eligibilityService.listReviewRequests({ status: 'Pending Review' }),
        ]);

      if (summaryData.status === 'fulfilled') {
        setStats(summaryData.value);
      }
      if (pendingRes.status === 'fulfilled') {
        setPendingRequestsCount(pendingRes.value.length);
      }
      if (clearances.status === 'fulfilled') {
        setPendingClearancesCount(clearances.value.length);
      }

      let loans: Reservation[] = [];
      if (collectedRes.status === 'fulfilled') {
        loans = [...loans, ...collectedRes.value];
      }
      if (overdueRes.status === 'fulfilled') {
        setOverdueCount(overdueRes.value.length);
        loans = [...loans, ...overdueRes.value];
      }
      setActiveLoans(loans);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated, canAccess]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const handleRunAutomation = async () => {
    setRunningAutomation(true);
    setAutomationError(null);
    setAutomationResult(null);
    try {
      const res = await notificationService.runAutomation();
      setAutomationResult(res);
      await loadDashboardData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Automation execution failed.';
      setAutomationError(msg);
    } finally {
      setRunningAutomation(false);
    }
  };

  const handleReturnEquipment = async (id: number) => {
    setLoanActionInProgress(id);
    setActionSuccess(null);
    try {
      await reservationService.markReturn(id);
      await reservationService.markCompleted(id);
      setActionSuccess(`Loan #${id} successfully marked as returned & completed.`);
      await loadDashboardData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to return loan.');
    } finally {
      setLoanActionInProgress(null);
    }
  };

  if (!isAuthenticated || !canAccess) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-8 sm:p-10 max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-7 h-7 text-amber-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Custodian Access Restricted</h2>
          <p className="text-xs text-slate-500 mb-6">
            The Lab Dashboard is exclusively accessible to authorized Lab Custodians and Campus Administrators.
          </p>
          <Button variant="primary" size="sm" onClick={onNavigateToDiscover}>
            Return to Discover
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Dashboard Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white rounded-2xl border border-slate-200/90 shadow-subtle">
        <div>
          <div className="flex items-center gap-2 text-cyan-600 text-xs font-semibold mb-1">
            <LayoutDashboard className="w-4 h-4" />
            <span>Custodian Command Center</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Lab &amp; Equipment Oversight Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time equipment utilization, active student custody monitoring, and automated lifecycle policies.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading || refreshing}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => onNavigateToReviewQueue('reservations')}
            className="bg-navy-900 text-cyan-300 hover:bg-navy-800"
            icon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            Review Queue
          </Button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccess(null)}
            className="text-emerald-700 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Total Assets
            </span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {stats?.total ?? '—'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Registered in catalog</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Available Now
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600">
            {stats?.available ?? '—'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Ready for checkout</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Active Loans
            </span>
            <Package className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-extrabold text-indigo-600">
            {activeLoans.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">In borrower custody</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Pending Review
            </span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-amber-600">
            {pendingRequestsCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Requires approval</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Overdue
            </span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-extrabold text-rose-600">
            {overdueCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Past return deadline</p>
        </div>
      </div>

      {/* Automation Maintenance Engine Box */}
      <div className="bg-gradient-to-r from-navy-950 via-slate-900 to-navy-900 text-white rounded-2xl p-6 border border-slate-800 shadow-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[11px] font-semibold">
              <RefreshCw className="w-3 h-3 text-cyan-400" />
              <span>Background Maintenance Engine</span>
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Automated Reminders, Overdue Detection &amp; Expiry
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Dispatches 2h pickup reminders, 2h return reminders, transitions past-deadline loans to Overdue, and cancels abandoned uncollected equipment past the 24h grace window.
            </p>
          </div>

          <div className="shrink-0">
            <Button
              variant="primary"
              size="md"
              onClick={handleRunAutomation}
              disabled={runningAutomation}
              className="bg-cyan-500 hover:bg-cyan-400 text-navy-950 font-bold text-xs"
              icon={
                <Play className={`w-3.5 h-3.5 fill-current ${runningAutomation ? 'animate-spin' : ''}`} />
              }
            >
              {runningAutomation ? 'Executing Automation...' : 'Run Automation Worker'}
            </Button>
          </div>
        </div>

        {automationResult && (
          <div className="mt-4 p-4 bg-slate-800/80 border border-slate-700 rounded-xl text-xs space-y-2">
            <div className="flex items-center gap-2 text-cyan-300 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              <span>Automation Completed Successfully ({new Date(automationResult.timestamp).toLocaleTimeString()})</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-300 pt-1">
              <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-700/60">
                <span className="text-[10px] text-slate-400 block">Pickup Reminders</span>
                <span className="font-bold text-white text-sm">{automationResult.pickup_reminders_sent}</span>
              </div>
              <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-700/60">
                <span className="text-[10px] text-slate-400 block">Return Reminders</span>
                <span className="font-bold text-white text-sm">{automationResult.return_reminders_sent}</span>
              </div>
              <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-700/60">
                <span className="text-[10px] text-slate-400 block">Overdue Marked</span>
                <span className="font-bold text-rose-400 text-sm">{automationResult.overdue_marked}</span>
              </div>
              <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-700/60">
                <span className="text-[10px] text-slate-400 block">Uncollected Expired</span>
                <span className="font-bold text-amber-400 text-sm">{automationResult.expired_uncollected_cancelled}</span>
              </div>
            </div>
          </div>
        )}

        {automationError && (
          <div className="mt-4 p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-xs text-rose-200">
            {automationError}
          </div>
        )}
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="w-8 h-8 rounded-lg bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-600">
                <Clock className="w-4 h-4" />
              </span>
              <Badge variant={pendingRequestsCount > 0 ? 'warning' : 'default'} size="sm">
                {pendingRequestsCount} Pending
              </Badge>
            </div>
            <h4 className="text-sm font-bold text-slate-900">Equipment Reservations</h4>
            <p className="text-xs text-slate-500 mt-1">
              Approve, reject, or mark equipment ready for student pickup.
            </p>
          </div>
          <div className="pt-4 mt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => onNavigateToReviewQueue('reservations')}
              className="text-xs font-semibold text-cyan-700 hover:text-cyan-800 flex items-center gap-1.5"
            >
              <span>Open Reservation Queue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <Award className="w-4 h-4" />
              </span>
              <Badge variant={pendingClearancesCount > 0 ? 'warning' : 'default'} size="sm">
                {pendingClearancesCount} Pending
              </Badge>
            </div>
            <h4 className="text-sm font-bold text-slate-900">Safety Clearances</h4>
            <p className="text-xs text-slate-500 mt-1">
              Verify student lab safety and specialized machine certifications.
            </p>
          </div>
          <div className="pt-4 mt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => onNavigateToReviewQueue('clearances')}
              className="text-xs font-semibold text-cyan-700 hover:text-cyan-800 flex items-center gap-1.5"
            >
              <span>Review Safety Clearances</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                <Package className="w-4 h-4" />
              </span>
              <Badge variant="default" size="sm">
                Catalog View
              </Badge>
            </div>
            <h4 className="text-sm font-bold text-slate-900">Resource Inventory</h4>
            <p className="text-xs text-slate-500 mt-1">
              Inspect all instruments, models, and laboratory locations.
            </p>
          </div>
          <div className="pt-4 mt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onNavigateToDiscover}
              className="text-xs font-semibold text-cyan-700 hover:text-cyan-800 flex items-center gap-1.5"
            >
              <span>Explore Resource Catalog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Active Equipment Custody Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Active Equipment Loans ({activeLoans.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Equipment currently checked out or past scheduled return deadline.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            icon={<RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />}
          >
            Refresh List
          </Button>
        </div>

        {activeLoans.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800">No Equipment Currently on Loan</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              All campus assets are presently secured in their respective laboratories.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold">
                <tr>
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Equipment</th>
                  <th className="py-3 px-4">Borrower</th>
                  <th className="py-3 px-4">Return Deadline</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Custodian Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeLoans.map((loan) => {
                  const isBusy = loanActionInProgress === loan.id;
                  const isOverdue = loan.status === 'Overdue';

                  return (
                    <tr key={loan.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-500">
                        #{loan.id}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {loan.resource?.name || loan.resource_id}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{loan.requester?.full_name || `User #${loan.requester_id}`}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span className={isOverdue ? 'text-rose-600 font-bold' : ''}>
                            {new Date(loan.end_at).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                            })}{' '}
                            {new Date(loan.end_at).toLocaleTimeString([], {
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={isOverdue ? 'danger' : 'default'} dot size="sm">
                          {loan.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={isBusy}
                          onClick={() => handleReturnEquipment(loan.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px]"
                          icon={<CheckCheck className="w-3 h-3" />}
                        >
                          {isBusy ? 'Processing...' : 'Record Return & Complete'}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
