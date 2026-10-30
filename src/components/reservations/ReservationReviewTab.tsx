import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  User,
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertCircle,
  PackageCheck,
  PackageMinus,
  CheckCheck,
} from 'lucide-react';
import { reservationService } from '../../services/reservationService';
import { Reservation } from '../../types/reservation';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';

export const ReservationReviewTab: React.FC = () => {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>('Pending');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Review modal state
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [decision, setDecision] = useState<'Approved' | 'Rejected'>('Approved');
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [actionInProgressId, setActionInProgressId] = useState<number | null>(null);

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await reservationService.getReviewQueue(statusFilter);
      setReservations(data);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Failed to fetch reservation review queue.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const handleOpenReview = (r: Reservation, action: 'Approved' | 'Rejected') => {
    setSelectedReservation(r);
    setDecision(action);
    setReviewNotes('');
    setReviewModalOpen(true);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReservation) return;

    setIsSubmittingReview(true);
    setError(null);
    try {
      await reservationService.reviewReservation(selectedReservation.id, {
        status: decision,
        review_notes: reviewNotes.trim() || undefined,
      });
      setActionSuccess(
        `Reservation #${selectedReservation.id} was successfully ${decision.toLowerCase()}.`
      );
      setReviewModalOpen(false);
      fetchQueue();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to submit review decision.';
      setError(msg);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleTransitionAction = async (
    id: number,
    action: 'ready' | 'collect' | 'return' | 'complete'
  ) => {
    setActionInProgressId(id);
    setError(null);
    try {
      if (action === 'ready') {
        await reservationService.markReadyForPickup(id);
        setActionSuccess(`Reservation #${id} is now Ready for Pickup.`);
      } else if (action === 'collect') {
        await reservationService.markCollected(id);
        setActionSuccess(`Handover recorded for Reservation #${id} (Collected).`);
      } else if (action === 'return') {
        await reservationService.markReturn(id);
        setActionSuccess(`Return recorded for Reservation #${id} (Return Pending).`);
      } else if (action === 'complete') {
        await reservationService.markCompleted(id);
        setActionSuccess(`Reservation #${id} completed and asset returned to catalog.`);
      }
      fetchQueue();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to update reservation status.';
      setError(msg);
    } finally {
      setActionInProgressId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Action alerts */}
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

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-rose-700 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {[
          { label: 'Pending Review', value: 'Pending' },
          { label: 'Approved', value: 'Approved' },
          { label: 'Ready for Pickup', value: 'Ready for Pickup' },
          { label: 'Active Loans', value: 'Collected' },
          { label: 'Return Pending', value: 'Return Pending' },
          { label: 'Overdue', value: 'Overdue' },
          { label: 'Completed', value: 'Completed' },
          { label: 'All Requests', value: 'All' },
        ].map((tab) => {
          const isActive = statusFilter === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-navy-900 text-cyan-300 font-semibold shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500 font-medium">
          {statusFilter === 'All' ? 'All Reservations' : `${statusFilter} Reservations`} ({reservations.length})
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchQueue}
          disabled={loading}
          icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
        >
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="py-16 text-center">
          <RefreshCw className="w-7 h-7 text-cyan-600 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500">Loading pending requests...</p>
        </div>
      ) : reservations.length === 0 ? (
        <div className="p-10 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
          <h4 className="text-sm font-bold text-slate-800">
            Review Queue Clear
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            All submitted equipment requests have been processed. New bookings will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reservations.map((r) => {
            const isOwnRequest = r.requester_id === user?.id;
            const isBusy = actionInProgressId === r.id;

            return (
              <div
                key={r.id}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-slate-500 font-semibold">
                      #{r.id}
                    </span>
                    <span className="font-bold text-slate-900 text-sm">
                      {r.resource?.name || r.resource_id}
                    </span>
                    <Badge variant="warning" dot size="sm">
                      {r.status}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-medium text-slate-700">
                        {r.requester?.full_name || `Requester #${r.requester_id}`}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        ({r.requester?.role})
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {new Date(r.start_at).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
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

                  <div className="pt-1 text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="font-semibold text-slate-700 block mb-0.5">
                      Purpose:
                    </span>
                    <p className="line-clamp-2">{r.purpose}</p>
                  </div>
                </div>

                {/* Reviewer Action Buttons */}
                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  {isOwnRequest ? (
                    <span className="text-[11px] text-amber-700 font-medium px-2 py-1 bg-amber-50 rounded-lg border border-amber-200">
                      Cannot review own request
                    </span>
                  ) : r.status === 'Pending' ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenReview(r, 'Rejected')}
                        className="text-rose-600 border-rose-200 hover:bg-rose-50 text-xs"
                      >
                        Reject
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleOpenReview(r, 'Approved')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                      >
                        Approve Request
                      </Button>
                    </>
                  ) : r.status === 'Approved' ? (
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={isBusy}
                      onClick={() => handleTransitionAction(r.id, 'ready')}
                      className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs"
                      icon={<PackageCheck className="w-3.5 h-3.5" />}
                    >
                      {isBusy ? 'Updating...' : 'Ready for Pickup'}
                    </Button>
                  ) : r.status === 'Ready for Pickup' ? (
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={isBusy}
                      onClick={() => handleTransitionAction(r.id, 'collect')}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
                      icon={<PackageMinus className="w-3.5 h-3.5" />}
                    >
                      {isBusy ? 'Updating...' : 'Record Collection'}
                    </Button>
                  ) : r.status === 'Collected' ? (
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={isBusy}
                      onClick={() => handleTransitionAction(r.id, 'return')}
                      className="bg-amber-600 hover:bg-amber-700 text-white text-xs"
                    >
                      {isBusy ? 'Updating...' : 'Record Return'}
                    </Button>
                  ) : r.status === 'Return Pending' || r.status === 'Overdue' ? (
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={isBusy}
                      onClick={() => handleTransitionAction(r.id, 'complete')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                      icon={<CheckCheck className="w-3.5 h-3.5" />}
                    >
                      {isBusy ? 'Updating...' : r.status === 'Overdue' ? 'Resolve Overdue & Complete' : 'Complete Reservation'}
                    </Button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Decision Modal */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        maxWidth="md"
        title={
          <div className="flex items-center gap-2">
            {decision === 'Approved' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-600" />
            )}
            <span>
              {decision === 'Approved'
                ? 'Approve Resource Reservation'
                : 'Reject Resource Reservation'}
            </span>
          </div>
        }
        subtitle={
          selectedReservation && (
            <span className="text-xs text-slate-500">
              Request #{selectedReservation.id} • {selectedReservation.resource?.name}
            </span>
          )
        }
      >
        <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Custodian Review Notes (Optional)
            </label>
            <textarea
              rows={3}
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder={
                decision === 'Approved'
                  ? 'e.g., Equipment prepared in Room 204. Please bring your student ID card.'
                  : 'e.g., Conflicting department research schedule or insufficient safety documentation.'
              }
              className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-campus-500 text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setReviewModalOpen(false)}
              disabled={isSubmittingReview}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmittingReview}
              className={
                decision === 'Approved'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-rose-600 hover:bg-rose-700 text-white'
              }
            >
              {isSubmittingReview
                ? 'Submitting...'
                : `Confirm ${decision}`}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
