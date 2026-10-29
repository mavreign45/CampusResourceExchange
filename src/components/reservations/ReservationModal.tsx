import React, { useState, useEffect } from 'react';
import {
  Calendar,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { Resource } from '../../types/resource';
import { Reservation } from '../../types/reservation';
import { useAuth } from '../../context/AuthContext';
import { reservationService } from '../../services/reservationService';
import { eligibilityService } from '../../services/eligibilityService';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface ReservationModalProps {
  resource: Resource | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (reservation: Reservation) => void;
  onOpenAuthModal?: () => void;
}

export const ReservationModal: React.FC<ReservationModalProps> = ({
  resource,
  isOpen,
  onClose,
  onSuccess,
  onOpenAuthModal,
}) => {
  const { user, isAuthenticated } = useAuth();

  // Tomorrow 9am to 1pm default
  const getDefaultDates = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);

    const end = new Date(tomorrow);
    end.setHours(13, 0, 0, 0);

    const pad = (n: number) => String(n).padStart(2, '0');
    const toIsoLocal = (d: Date) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

    return {
      start: toIsoLocal(tomorrow),
      end: toIsoLocal(end),
    };
  };

  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [purpose, setPurpose] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedReservation, setSubmittedReservation] = useState<Reservation | null>(null);
  const [hasClearance, setHasClearance] = useState<boolean | null>(null);
  const [clearanceLoading, setClearanceLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const defaults = getDefaultDates();
      setStartAt(defaults.start);
      setEndAt(defaults.end);
      setPurpose('');
      setErrorMessage(null);
      setSubmittedReservation(null);

      if (resource?.requiresVerification && isAuthenticated) {
        setClearanceLoading(true);
        eligibilityService
          .getMyEligibility()
          .then((records) => {
            const verified = records.some(
              (r) =>
                r.status === 'Verified' &&
                (r.resource_id === resource.id ||
                  (resource.trainingRequirement &&
                    r.requirement_type.toLowerCase() ===
                      resource.trainingRequirement.toLowerCase()))
            );
            // Custodians and Admins intrinsically have clearance
            const isPrivileged =
              user?.role === 'Lab Custodian' || user?.role === 'Admin';
            setHasClearance(verified || isPrivileged);
          })
          .catch(() => setHasClearance(false))
          .finally(() => setClearanceLoading(false));
      } else {
        setHasClearance(true);
      }
    }
  }, [isOpen, resource, isAuthenticated, user]);

  if (!resource) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      if (onOpenAuthModal) onOpenAuthModal();
      return;
    }

    setErrorMessage(null);

    // Validation
    const startDate = new Date(startAt);
    const endDate = new Date(endAt);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      setErrorMessage('Please provide valid start and end dates and times.');
      return;
    }

    if (endDate <= startDate) {
      setErrorMessage('End time must be after start time.');
      return;
    }

    if (startDate < new Date()) {
      setErrorMessage('Reservation start time cannot be in the past.');
      return;
    }

    if (!purpose.trim() || purpose.trim().length < 10) {
      setErrorMessage('Please provide a specific academic or research purpose (at least 10 characters).');
      return;
    }

    setIsSubmitting(true);
    try {
      const reservation = await reservationService.createReservation({
        resource_id: resource.id,
        start_at: startDate.toISOString(),
        end_at: endDate.toISOString(),
        purpose: purpose.trim(),
      });
      setSubmittedReservation(reservation);
      if (onSuccess) onSuccess(reservation);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Unable to submit reservation request. Please try again.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="xl"
      title={
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-campus-600" />
          <span>Reserve Resource</span>
        </div>
      }
      subtitle={
        <span className="text-slate-600 text-xs">
          {resource.name} • {resource.location.building} ({resource.location.room})
        </span>
      }
    >
      {submittedReservation ? (
        <div className="py-6 px-2 text-center space-y-4">
          <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Reservation Request Submitted!
            </h3>
            <p className="text-xs text-slate-600 max-w-sm mx-auto mt-1">
              Your request for <strong>{resource.name}</strong> has been placed in the custodian review queue.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-left max-w-sm mx-auto space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Request ID:</span>
              <span className="font-mono font-semibold text-slate-800">
                #{submittedReservation.id}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Current Status:</span>
              <span className="font-semibold text-amber-600">
                {submittedReservation.status}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Scheduled Start:</span>
              <span className="text-slate-800">
                {new Date(submittedReservation.start_at).toLocaleString([], {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Scheduled End:</span>
              <span className="text-slate-800">
                {new Date(submittedReservation.end_at).toLocaleString([], {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </span>
            </div>
          </div>

          <div className="pt-2 flex justify-center">
            <Button variant="primary" size="md" onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Unauthenticated warning */}
          {!isAuthenticated ? (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Sign In Required</span>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    You must sign in with your campus account to submit a reservation request.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="primary"
                size="sm"
                className="shrink-0 bg-navy-900 text-white"
                onClick={onOpenAuthModal}
              >
                Sign In
              </Button>
            </div>
          ) : null}

          {/* Training Clearance Requirement notice */}
          {resource.requiresVerification && isAuthenticated && (
            <div>
              {clearanceLoading ? (
                <div className="p-3 bg-slate-50 rounded-lg text-slate-500 text-[11px]">
                  Checking safety clearance status...
                </div>
              ) : hasClearance ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    <strong>Clearance Verified:</strong> You have active authorization for {resource.trainingRequirement || 'this equipment'}.
                  </span>
                </div>
              ) : (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-800">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Mandatory Training Clearance Required</span>
                    <span className="text-[11px] text-rose-700">
                      This asset requires verified training ({resource.trainingRequirement}). Requests without verified certification will be rejected by the custodian.
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Form error message */}
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Time Picker Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Start Date &amp; Time <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="datetime-local"
                  required
                  value={startAt}
                  onChange={(e) => setStartAt(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-campus-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                End Date &amp; Time <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="datetime-local"
                  required
                  value={endAt}
                  onChange={(e) => setEndAt(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-campus-500"
                />
              </div>
            </div>
          </div>

          <div className="p-2.5 bg-slate-50 rounded-lg text-slate-500 text-[11px] flex items-center justify-between">
            <span>Allowed Window: Up to {resource.maxBorrowDuration || `${resource.maxBorrowHours} hours`}</span>
            <span>Custodian: {resource.owner.name}</span>
          </div>

          {/* Academic Purpose Textarea */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Academic Purpose / Project Justification <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g., Capstone project sensor integration, signals research lab experiment, or course assignment..."
              className="w-full p-3 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-campus-500 placeholder:text-slate-400"
            />
            <span className="text-[10px] text-slate-400">
              Lab custodians review your justification before approving equipment access.
            </span>
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="bg-navy-900 hover:bg-slate-800 text-white"
              disabled={isSubmitting || !isAuthenticated}
              icon={<Sparkles className="w-3.5 h-3.5 text-cyan-400" />}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
