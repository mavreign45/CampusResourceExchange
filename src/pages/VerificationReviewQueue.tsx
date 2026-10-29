import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertCircle,
  User,
  GraduationCap,
  Building,
  Check,
  X,
  FileText,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { eligibilityService } from '../services/eligibilityService';
import { EligibilityRecord, VerificationStatus } from '../types/auth';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { ReservationReviewTab } from '../components/reservations/ReservationReviewTab';

export const VerificationReviewQueue: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'reservations' | 'clearances'>('reservations');
  const [requests, setRequests] = useState<EligibilityRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>('Pending Review');

  // Review Modal state
  const [activeRequest, setActiveRequest] = useState<EligibilityRecord | null>(null);
  const [reviewAction, setReviewAction] = useState<'Verified' | 'Rejected'>('Verified');
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);
  const [reviewModalOpen, setReviewModalOpen] = useState<boolean>(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const canReview = user?.role === 'Lab Custodian' || user?.role === 'Admin';

  const fetchQueue = useCallback(async () => {
    if (!canReview) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await eligibilityService.listReviewRequests({
        status: statusFilter === 'All' ? undefined : statusFilter,
      });
      setRequests(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch verification queue';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [canReview, statusFilter]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const handleOpenReview = (req: EligibilityRecord, action: 'Verified' | 'Rejected') => {
    setActiveRequest(req);
    setReviewAction(action);
    setReviewNotes(
      action === 'Verified'
        ? 'Verified against department records and safety training completion.'
        : 'Documentation incomplete or missing formal safety orientation sign-off.'
    );
    setReviewError(null);
    setReviewModalOpen(true);
  };

  const handleConfirmReview = async () => {
    if (!activeRequest) return;
    setSubmittingReview(true);
    setReviewError(null);
    try {
      await eligibilityService.reviewRequest(activeRequest.id, {
        status: reviewAction,
        review_notes: reviewNotes.trim() || undefined,
      });
      setReviewModalOpen(false);
      setActiveRequest(null);
      await fetchQueue();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit review';
      setReviewError(msg);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (!isAuthenticated || !canReview) {
    return (
      <div className="py-12 px-4 max-w-xl mx-auto text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-4 text-amber-700">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">
          Reviewer Authorization Required
        </h2>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          The Verification Review Queue is restricted to verified <strong>Lab Custodians</strong> and <strong>Administrators</strong>.
          Under our Role-Based Access Control (RBAC) protocol, students and unauthorized personnel cannot review or alter training clearances.
        </p>
      </div>
    );
  }

  const getStatusBadge = (status: VerificationStatus) => {
    switch (status) {
      case 'Verified':
        return <Badge variant="success" dot size="sm">Verified</Badge>;
      case 'Pending Review':
        return <Badge variant="warning" dot size="sm">Pending Review</Badge>;
      case 'Rejected':
        return <Badge variant="danger" size="sm">Rejected</Badge>;
      default:
        return <Badge variant="default" size="sm">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Equipment Clearance Review Queue
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-navy-100 text-navy-900">
              {user?.role} Portal
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Review submitted student training documentation and grant verified access to restricted lab equipment.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchQueue}
            disabled={loading}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
          >
            Refresh Queue
          </Button>
        </div>
      </div>

      {/* Top Level Category Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('reservations')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'reservations'
              ? 'border-campus-600 text-campus-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Equipment Reservations
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('clearances')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'clearances'
              ? 'border-campus-600 text-campus-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Safety Clearances &amp; Training
        </button>
      </div>

      {activeTab === 'reservations' ? (
        <ReservationReviewTab />
      ) : (
        <>
          {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl max-w-fit">
        {['Pending Review', 'Verified', 'Rejected', 'All'].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setStatusFilter(tab)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              statusFilter === tab
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Queue Content */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-cyan-600 mb-2" />
          Loading clearance requests...
        </div>
      ) : requests.length === 0 ? (
        <div className="py-12 bg-white rounded-2xl border border-slate-200 text-center p-8 shadow-xs">
          <ShieldCheck className="w-12 h-12 text-emerald-500/40 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">
            Queue is Clear
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            No verification requests found matching filter &quot;{statusFilter}&quot;.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {requests.map((item) => {
            const isSelfRequest = item.user_id === user?.id;
            return (
              <div
                key={item.id}
                className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Applicant & Request details */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">
                        {item.requirement_type}
                      </span>
                      {getStatusBadge(item.status)}
                      {item.resource_id && (
                        <span className="text-[11px] px-2 py-0.5 rounded bg-cyan-50 text-cyan-800 border border-cyan-100 font-mono">
                          Target: {item.resource_id}
                        </span>
                      )}
                    </div>

                    {/* Applicant metadata */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                      <span className="flex items-center gap-1 font-semibold text-slate-800">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {item.user_name || `User #${item.user_id}`}
                      </span>
                      {item.user_email && (
                        <span className="text-slate-400">({item.user_email})</span>
                      )}
                      {item.user_department && (
                        <span className="flex items-center gap-1 text-slate-500">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          {item.user_department}
                        </span>
                      )}
                      {item.user_student_id && (
                        <span className="flex items-center gap-1 text-slate-500">
                          <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                          ID: {item.user_student_id}
                        </span>
                      )}
                    </div>

                    {/* Submitted Evidence block */}
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-700">
                      <strong className="text-slate-800">Evidence details:</strong>{' '}
                      {item.evidence_details || 'No evidence text provided.'}
                    </div>

                    {/* Existing Review Notes if already reviewed */}
                    {item.review_notes && (
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          <strong>Reviewer Notes:</strong> {item.review_notes}
                        </span>
                        {item.reviewed_at && (
                          <span className="text-slate-400">
                            • {new Date(item.reviewed_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                    {item.status === 'Pending Review' ? (
                      isSelfRequest ? (
                        <div className="text-[11px] text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                          Self-review prohibited (Conflict of interest)
                        </div>
                      ) : (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            icon={<Check className="w-3.5 h-3.5" />}
                            onClick={() => handleOpenReview(item, 'Verified')}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-rose-200 text-rose-700 hover:bg-rose-50"
                            icon={<X className="w-3.5 h-3.5" />}
                            onClick={() => handleOpenReview(item, 'Rejected')}
                          >
                            Reject
                          </Button>
                        </>
                      )
                    ) : (
                      <span className="text-[11px] text-slate-400 font-medium self-center sm:self-auto">
                        Resolved
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  )}

      {/* Review Modal */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        maxWidth="md"
        title={
          <div className="flex items-center gap-2">
            {reviewAction === 'Verified' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-600" />
            )}
            <h3 className="text-base font-bold text-slate-900">
              {reviewAction === 'Verified' ? 'Approve Equipment Clearance' : 'Reject Clearance Request'}
            </h3>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            You are about to mark this request for{' '}
            <strong className="text-slate-900">{activeRequest?.user_name}</strong> as{' '}
            <strong className={reviewAction === 'Verified' ? 'text-emerald-700' : 'text-rose-700'}>
              {reviewAction}
            </strong>.
          </p>

          {reviewError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{reviewError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reviewer Audit Notes {reviewAction === 'Rejected' && '*'}
            </label>
            <textarea
              rows={3}
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Provide context or instructions for the applicant..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:bg-white resize-y"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReviewModalOpen(false)}
              disabled={submittingReview}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={submittingReview}
              className={
                reviewAction === 'Verified'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-rose-600 hover:bg-rose-700 text-white'
              }
              onClick={handleConfirmReview}
            >
              {submittingReview ? 'Recording...' : `Confirm ${reviewAction}`}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
