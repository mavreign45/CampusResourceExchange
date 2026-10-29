import React, { useState, useEffect, useCallback } from 'react';
import {
  FileClock,
  Calendar,
  Clock,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  LogIn,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { reservationService } from '../services/reservationService';
import { Reservation, ReservationStatus } from '../types/reservation';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

interface MyRequestsPageProps {
  onOpenAuthModal?: () => void;
  onNavigateToDiscover?: () => void;
}

export const MyRequestsPage: React.FC<MyRequestsPageProps> = ({
  onOpenAuthModal,
  onNavigateToDiscover,
}) => {
  const { user, isAuthenticated } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchReservations = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await reservationService.getMyReservations();
      setReservations(data);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Failed to load your resource requests.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  const handleCancel = async (id: number) => {
    if (!window.confirm('Are you sure you want to cancel this reservation request?')) {
      return;
    }
    setCancellingId(id);
    setActionSuccess(null);
    try {
      const updated = await reservationService.cancelReservation(id);
      setReservations((prev) =>
        prev.map((r) => (r.id === id ? updated : r))
      );
      setActionSuccess(`Reservation #${id} has been cancelled successfully.`);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to cancel reservation.';
      setError(msg);
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusBadge = (status: ReservationStatus) => {
    switch (status) {
      case 'Pending':
        return (
          <Badge variant="warning" dot size="sm">
            Pending Review
          </Badge>
        );
      case 'Approved':
        return (
          <Badge variant="success" dot size="sm">
            Approved
          </Badge>
        );
      case 'Ready for Pickup':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-cyan-100 text-cyan-800 border border-cyan-300">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
            Ready for Pickup
          </span>
        );
      case 'Collected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-300">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            In Your Custody
          </span>
        );
      case 'Return Pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Return Pending
          </span>
        );
      case 'Completed':
        return (
          <Badge variant="default" size="sm">
            Completed
          </Badge>
        );
      case 'Rejected':
        return (
          <Badge variant="danger" size="sm">
            Rejected
          </Badge>
        );
      case 'Cancelled':
        return (
          <Badge variant="default" size="sm">
            Cancelled
          </Badge>
        );
      case 'Overdue':
        return (
          <Badge variant="danger" dot size="sm">
            Overdue
          </Badge>
        );
      default:
        return <Badge variant="default" size="sm">{status}</Badge>;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="py-16 px-4 max-w-xl mx-auto text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-cyan-50 text-cyan-700 border border-cyan-200 flex items-center justify-center mx-auto shadow-xs">
          <LogIn className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">
          Sign In to Access Your Requests
        </h2>
        <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
          Log in with your academic credentials to track equipment booking statuses, custodian review approvals, and handover pickup windows.
        </p>
        <div className="pt-2">
          <Button
            variant="primary"
            size="md"
            onClick={onOpenAuthModal}
            className="bg-navy-900 text-white"
          >
            Sign In with Campus Account
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              My Access Requests
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800">
              Live Workflow
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Logged in as <strong className="text-slate-800">{user?.full_name}</strong> ({user?.role}) • Real-time status of your campus resource bookings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchReservations}
            disabled={loading}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
          {onNavigateToDiscover && (
            <Button
              variant="primary"
              size="sm"
              onClick={onNavigateToDiscover}
              className="bg-navy-900 text-white"
              icon={<ArrowRight className="w-3.5 h-3.5 text-cyan-400" />}
            >
              Browse Catalog
            </Button>
          )}
        </div>
      </div>

      {/* Notifications / Alerts */}
      {actionSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccess(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-rose-700 hover:text-rose-900 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Content list */}
      {loading ? (
        <div className="py-20 text-center">
          <RefreshCw className="w-8 h-8 text-cyan-600 animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500">Loading your reservation requests...</p>
        </div>
      ) : reservations.length === 0 ? (
        <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center space-y-4 max-w-lg mx-auto">
          <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl border border-slate-200 flex items-center justify-center mx-auto">
            <FileClock className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              No Reservation Requests Yet
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              You haven't requested any campus equipment or spaces. Discover available laboratory tools, computing resources, and media kits in the catalog.
            </p>
          </div>
          {onNavigateToDiscover && (
            <div className="pt-2">
              <Button
                variant="primary"
                size="md"
                onClick={onNavigateToDiscover}
                className="bg-navy-900 text-white"
              >
                Discover Resources
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {reservations.map((r) => {
            const isExpanded = expandedId === r.id;
            const canCancel = r.status === 'Pending' || r.status === 'Approved';

            return (
              <div
                key={r.id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-subtle hover:border-slate-300 transition-all"
              >
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Resource & Date details */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono text-[11px] font-semibold text-slate-500">
                        #{r.id}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 truncate">
                        {r.resource?.name || r.resource_id}
                      </h3>
                      {getStatusBadge(r.status)}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {new Date(r.start_at).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {new Date(r.start_at).toLocaleTimeString([], {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}{' '}
                          –{' '}
                          {new Date(r.end_at).toLocaleTimeString([], {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {canCancel && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={cancellingId === r.id}
                        onClick={() => handleCancel(r.id)}
                        className="text-rose-600 border-rose-200 hover:bg-rose-50 text-xs"
                      >
                        {cancellingId === r.id ? 'Cancelling...' : 'Cancel'}
                      </Button>
                    )}

                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : r.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      aria-label="Toggle details"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Accordion Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-2 border-t border-slate-100 bg-slate-50/70 text-xs space-y-3">
                    <div>
                      <span className="font-semibold text-slate-700 block mb-0.5">
                        Stated Purpose / Project Context:
                      </span>
                      <p className="text-slate-600 bg-white p-3 rounded-lg border border-slate-200">
                        {r.purpose}
                      </p>
                    </div>

                    {r.review_notes && (
                      <div>
                        <span className="font-semibold text-slate-700 block mb-0.5">
                          Custodian Review Notes:
                        </span>
                        <p className="text-slate-700 bg-amber-50/80 p-3 rounded-lg border border-amber-200 text-xs">
                          {r.review_notes}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px] text-slate-500">
                      <div>
                        <span className="block text-slate-400">Submitted:</span>
                        <span className="text-slate-700">
                          {new Date(r.submitted_at || r.created_at).toLocaleString([], {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </span>
                      </div>

                      {r.approved_at && (
                        <div>
                          <span className="block text-slate-400">Approved:</span>
                          <span className="text-slate-700">
                            {new Date(r.approved_at).toLocaleString([], {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                          </span>
                        </div>
                      )}

                      {r.collected_at && (
                        <div>
                          <span className="block text-slate-400">Collected:</span>
                          <span className="text-slate-700">
                            {new Date(r.collected_at).toLocaleString([], {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                          </span>
                        </div>
                      )}

                      {r.returned_at && (
                        <div>
                          <span className="block text-slate-400">Returned:</span>
                          <span className="text-slate-700">
                            {new Date(r.returned_at).toLocaleString([], {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
