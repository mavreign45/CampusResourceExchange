import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  Plus,
  RefreshCw,
  AlertCircle,
  FileCheck2,
  Calendar,
  UserCheck,
  Award,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { eligibilityService } from '../services/eligibilityService';
import { EligibilityRecord } from '../types/auth';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { VerificationRequestModal } from '../components/eligibility/VerificationRequestModal';

interface EligibilityDashboardProps {
  onOpenAuthModal?: () => void;
  onNavigateToDiscover?: () => void;
}

export const EligibilityDashboard: React.FC<EligibilityDashboardProps> = ({
  onOpenAuthModal,
  onNavigateToDiscover,
}) => {
  const { user, isAuthenticated } = useAuth();
  const [records, setRecords] = useState<EligibilityRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState<boolean>(false);

  const fetchRecords = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await eligibilityService.getMyEligibility();
      setRecords(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load eligibility records';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  if (!isAuthenticated) {
    return (
      <div className="py-12 px-4 max-w-2xl mx-auto text-center">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto mb-4 text-slate-700 shadow-xs">
          <ShieldCheck className="w-7 h-7 text-cyan-600" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900">
          Sign In to Access Your Clearances
        </h2>
        <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
          Manage your verified equipment certifications, view pending safety clearances, and submit new training documentation.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button
            variant="primary"
            size="md"
            className="bg-navy-900 hover:bg-slate-800 text-white"
            onClick={onOpenAuthModal}
          >
            Sign In or Register
          </Button>
          {onNavigateToDiscover && (
            <Button variant="outline" size="md" onClick={onNavigateToDiscover}>
              Explore Resources
            </Button>
          )}
        </div>
      </div>
    );
  }

  const verifiedRecords = records.filter((r) => r.status === 'Verified');
  const pendingRecords = records.filter((r) => r.status === 'Pending Review');
  const rejectedRecords = records.filter((r) => r.status === 'Rejected');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              My Training Clearances & Certifications
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800">
              Phase 3 Live
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Logged in as <strong className="text-slate-800">{user?.full_name}</strong> ({user?.role}) • {user?.department || 'University Member'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchRecords}
            disabled={loading}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="bg-navy-900 hover:bg-slate-800 text-white"
            icon={<Plus className="w-3.5 h-3.5 text-cyan-400" />}
            onClick={() => setIsRequestModalOpen(true)}
          >
            Apply for Clearance
          </Button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
              Verified Clearances
            </span>
            <span className="text-2xl font-black text-emerald-600 mt-1 block">
              {verifiedRecords.length}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
              Pending Reviews
            </span>
            <span className="text-2xl font-black text-amber-600 mt-1 block">
              {pendingRecords.length}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
              Action Required / Rejected
            </span>
            <span className="text-2xl font-black text-slate-700 mt-1 block">
              {rejectedRecords.length}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Content Sections */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-cyan-600 mb-2" />
          Loading your training clearance records...
        </div>
      ) : records.length === 0 ? (
        <div className="py-12 bg-white rounded-2xl border border-slate-200 text-center p-8 shadow-xs">
          <FileCheck2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">
            No Training Clearances on File
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
            You do not currently have any active or pending equipment clearances. Submit documentation to unlock advanced lab access.
          </p>
          <div className="mt-5">
            <Button
              variant="primary"
              size="sm"
              className="bg-navy-900 hover:bg-slate-800 text-white"
              onClick={() => setIsRequestModalOpen(true)}
              icon={<Plus className="w-3.5 h-3.5 text-cyan-400" />}
            >
              Submit Your First Training Record
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Verified Clearances */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Active & Verified Clearances ({verifiedRecords.length})
              </h3>
            </div>

            {verifiedRecords.length === 0 ? (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 text-center">
                No active verified clearances yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {verifiedRecords.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 bg-white rounded-xl border border-emerald-200 shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="font-bold text-slate-900 text-xs leading-snug">
                          {item.requirement_type}
                        </span>
                        <Badge variant="success" dot size="sm">
                          Verified
                        </Badge>
                      </div>

                      {item.resource_id && (
                        <div className="text-[11px] text-cyan-800 font-medium mb-1.5">
                          Linked Resource: <span className="font-mono">{item.resource_id}</span>
                        </div>
                      )}

                      <p className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mb-2">
                        <strong>Evidence:</strong> {item.evidence_details}
                      </p>

                      {item.review_notes && (
                        <div className="text-[11px] text-emerald-900 bg-emerald-50/70 p-2 rounded-lg border border-emerald-100 flex items-start gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <strong>Reviewer Note:</strong> {item.review_notes}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Approved: {item.reviewed_at ? new Date(item.reviewed_at).toLocaleDateString() : 'Active'}
                      </span>
                      <span>Clearance #{item.id}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Applications */}
          {pendingRecords.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Applications Pending Review ({pendingRecords.length})
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {pendingRecords.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 bg-white rounded-xl border border-amber-200/80 shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="font-bold text-slate-900 text-xs">
                        {item.requirement_type}
                      </span>
                      <Badge variant="warning" dot size="sm">
                        Pending Review
                      </Badge>
                    </div>

                    {item.resource_id && (
                      <div className="text-[11px] text-cyan-800 font-medium mb-1.5">
                        Target Resource: <span className="font-mono">{item.resource_id}</span>
                      </div>
                    )}

                    <p className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <strong>Submitted Evidence:</strong> {item.evidence_details}
                    </p>

                    <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                      <span>Submitted: {new Date(item.created_at).toLocaleDateString()}</span>
                      <span className="text-amber-700 font-medium">Awaiting Custodian Sign-Off</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rejected Clearances */}
          {rejectedRecords.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Rejected / Action Required ({rejectedRecords.length})
                </h3>
              </div>

              <div className="space-y-2.5">
                {rejectedRecords.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 bg-rose-50/50 rounded-xl border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">
                          {item.requirement_type}
                        </span>
                        <Badge variant="danger" size="sm">
                          Rejected
                        </Badge>
                      </div>
                      <p className="text-[11px] text-rose-800 mt-1">
                        <strong>Reason:</strong> {item.review_notes || 'Documentation could not be verified by custodian.'}
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="border-rose-300 text-rose-800 hover:bg-rose-100 shrink-0 self-start sm:self-auto"
                      onClick={() => setIsRequestModalOpen(true)}
                    >
                      Re-apply with Documentation
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      <VerificationRequestModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        onSuccess={fetchRecords}
      />
    </div>
  );
};
