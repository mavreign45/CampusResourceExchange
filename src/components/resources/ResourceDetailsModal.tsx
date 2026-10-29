import React, { useState, useEffect } from 'react';
import {
  Building2,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  User,
  Calendar,
  Check,
  Package,
  FileText,
  Info,
  Sparkles,
  Award,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { Resource } from '../../types/resource';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { useAuth } from '../../context/AuthContext';
import { eligibilityService } from '../../services/eligibilityService';
import { VerificationRequestModal } from '../eligibility/VerificationRequestModal';

interface ResourceDetailsModalProps {
  resource: Resource | null;
  isOpen: boolean;
  onClose: () => void;
  isSaved?: boolean;
  onToggleSave?: (id: string) => void;
  onOpenAuthModal?: () => void;
}

export const ResourceDetailsModal: React.FC<ResourceDetailsModalProps> = ({
  resource,
  isOpen,
  onClose,
  isSaved = false,
  onToggleSave,
  onOpenAuthModal,
}) => {
  const { isAuthenticated } = useAuth();
  const [showBookingNotice, setShowBookingNotice] = useState(false);
  const [clearanceStatus, setClearanceStatus] = useState<
    'Verified' | 'Pending Review' | 'None'
  >('None');
  const [isClearanceModalOpen, setIsClearanceModalOpen] = useState(false);

  // Check user clearance status for this resource
  useEffect(() => {
    if (!isOpen || !resource || !isAuthenticated) {
      setClearanceStatus('None');
      return;
    }

    let isMounted = true;
    eligibilityService
      .getMyEligibility()
      .then((records) => {
        if (!isMounted) return;
        // Check if user has verified record for this resource or training requirement
        const matched = records.filter(
          (r) =>
            (r.resource_id && r.resource_id === resource.id) ||
            (resource.trainingRequirement &&
              r.requirement_type.toLowerCase() ===
                resource.trainingRequirement.toLowerCase())
        );

        const verified = matched.find((r) => r.status === 'Verified');
        if (verified) {
          setClearanceStatus('Verified');
          return;
        }

        const pending = matched.find((r) => r.status === 'Pending Review');
        if (pending) {
          setClearanceStatus('Pending Review');
          return;
        }

        setClearanceStatus('None');
      })
      .catch(() => {
        if (isMounted) setClearanceStatus('None');
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, resource, isAuthenticated]);

  if (!resource) return null;

  const handleRequestClick = () => {
    setShowBookingNotice(true);
  };

  const handleClose = () => {
    setShowBookingNotice(false);
    onClose();
  };

  const getStatusBadge = () => {
    switch (resource.status) {
      case 'available':
        return (
          <Badge variant="success" dot size="md">
            Available Now
          </Badge>
        );
      case 'in_use':
        return (
          <Badge variant="warning" dot size="md">
            Currently In Use {resource.estimatedAvailableDate ? `(Est. ${resource.estimatedAvailableDate})` : ''}
          </Badge>
        );
      case 'maintenance':
        return (
          <Badge variant="danger" dot size="md">
            Under Maintenance
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        maxWidth="3xl"
        title={
          <div className="flex items-center gap-2">
            <span>{resource.name}</span>
          </div>
        }
        subtitle={
          <span className="flex items-center gap-2 text-slate-500">
            <span>{resource.modelNumber || 'Standard Campus Asset'}</span>
            <span>•</span>
            <span className="text-slate-700 font-medium">{resource.category}</span>
          </span>
        }
        footer={
          <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-500 hidden sm:block">
              Campus ID: <span className="font-mono text-slate-700 font-medium">{resource.id}</span>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              {onToggleSave && (
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => onToggleSave(resource.id)}
                  className="w-full sm:w-auto"
                >
                  {isSaved ? 'Saved to Bookmarks' : 'Save Resource'}
                </Button>
              )}

              <Button
                variant="primary"
                size="md"
                className="w-full sm:w-auto bg-navy-900 hover:bg-slate-800 text-white"
                onClick={handleRequestClick}
                icon={<Sparkles className="w-4 h-4 text-cyan-400" />}
              >
                Request Access
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Phase Notice Banner when Request Access is clicked */}
          {showBookingNotice && (
            <div
              className="p-4 rounded-xl bg-gradient-to-r from-cyan-50 via-campus-50 to-blue-50 border border-cyan-200 shadow-xs animate-in fade-in duration-200"
              role="alert"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-cyan-600 text-white rounded-lg shrink-0 mt-0.5">
                  <Info className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-slate-900">
                    Booking & Handover Workflow (Phase 4)
                  </h4>
                  <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                    <strong>Phase 3 Complete:</strong> Authentication, user roles, and training verification are live.
                    Equipment booking reservations and custody handovers will be introduced in <strong>Phase 4</strong>.
                  </p>
                  <div className="mt-2.5 flex items-center gap-3">
                    <span className="inline-flex items-center text-[11px] font-semibold text-cyan-800 bg-cyan-100/80 px-2 py-0.5 rounded-md">
                      Coming in Phase 4
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowBookingNotice(false)}
                      className="text-xs text-slate-500 hover:text-slate-800 underline font-medium"
                    >
                      Dismiss message
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Hero Visual & Key Meta */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
            {/* Image */}
            <div className="md:col-span-5 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-video md:aspect-4/3 relative">
              <ImageWithFallback
                src={resource.imageUrl}
                alt={resource.name}
                fallbackCategory={resource.category}
                containerClassName="w-full h-full"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2.5 left-2.5">
                {getStatusBadge()}
              </div>
            </div>

            {/* Core Info & Location */}
            <div className="md:col-span-7 space-y-3.5">
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Overview & Purpose
                </h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {resource.fullDescription}
                </p>
              </div>

              {/* Quick Specs Grid */}
              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-[11px] text-slate-400 font-medium block">
                    Location
                  </span>
                  <span className="text-xs font-semibold text-slate-800 block truncate mt-0.5">
                    {resource.location.building}
                  </span>
                  <span className="text-[11px] text-slate-500 block truncate">
                    {resource.location.room} ({resource.location.campusZone})
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-[11px] text-slate-400 font-medium block">
                    Max Borrow Window
                  </span>
                  <span className="text-xs font-semibold text-slate-800 block mt-0.5">
                    {resource.maxBorrowDuration}
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Condition: {resource.itemCondition}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Eligibility & Training Requirements (Differentiator: Trusted & Fair Access) */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-700" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Access Eligibility & Verification Policy
                </h4>
              </div>
              <span className="text-[10px] text-cyan-800 font-semibold px-2 py-0.5 rounded bg-cyan-100/70">
                Phase 3 RBAC
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-white p-3 rounded-lg border border-slate-200/80">
                <span className="text-slate-500 font-medium block mb-1">
                  Student Eligibility:
                </span>
                <p className="text-slate-800 font-medium leading-relaxed">
                  {resource.eligibility}
                </p>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200/80">
                <span className="text-slate-500 font-medium block mb-1">
                  Mandatory Clearance / Training:
                </span>
                {resource.requiresVerification ? (
                  <div className="flex items-start gap-1.5 text-amber-800">
                    <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span className="font-semibold leading-snug">
                      {resource.trainingRequirement}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-emerald-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-medium">
                      No specialized training prerequisite required.
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Interactive User Verification Status Box */}
            {resource.requiresVerification && (
              <div className="pt-2">
                {!isAuthenticated ? (
                  <div className="p-3 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <span className="text-slate-600">
                      Sign in to verify your training credentials or submit certification evidence.
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-cyan-300 text-cyan-800 hover:bg-cyan-50 shrink-0"
                      onClick={() => onOpenAuthModal && onOpenAuthModal()}
                    >
                      Sign In to Check Status
                    </Button>
                  </div>
                ) : clearanceStatus === 'Verified' ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-2 text-xs text-emerald-800">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        <strong>Clearance Verified:</strong> You are authorized by lab custodians to borrow this equipment.
                      </span>
                    </div>
                    <Badge variant="success" size="sm">Verified</Badge>
                  </div>
                ) : clearanceStatus === 'Pending Review' ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-2 text-xs text-amber-800">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>
                        <strong>Verification Pending:</strong> Your clearance request has been submitted and is awaiting custodian review.
                      </span>
                    </div>
                    <Badge variant="warning" size="sm">Under Review</Badge>
                  </div>
                ) : (
                  <div className="p-3 bg-white rounded-xl border border-cyan-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="font-bold text-slate-800 block">
                        Safety Clearance Required to Request This Asset
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Submit evidence of {resource.trainingRequirement || 'training'} for custodian sign-off.
                      </span>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      className="bg-navy-900 hover:bg-slate-800 text-white shrink-0"
                      icon={<ArrowRight className="w-3.5 h-3.5 text-cyan-400" />}
                      onClick={() => setIsClearanceModalOpen(true)}
                    >
                      Apply for Clearance
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Specifications & Accessories */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Specifications */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>Technical Specifications</span>
              </div>
              <ul className="space-y-1.5 bg-white p-3 rounded-xl border border-slate-200 text-xs text-slate-700">
                {resource.specifications.map((spec, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-600 shrink-0 mt-1.5" />
                    <span>{spec}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Included Accessories */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                <Package className="w-3.5 h-3.5 text-slate-400" />
                <span>Package & Included Accessories</span>
              </div>
              <ul className="space-y-1.5 bg-white p-3 rounded-xl border border-slate-200 text-xs text-slate-700">
                {resource.accessoriesIncluded.map((acc, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{acc}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Responsible Department & Custodian Info */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Resource Custodian & Department Oversight
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
              <div className="flex items-start gap-2">
                <User className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-800 block">
                    {resource.owner.name}
                  </span>
                  <span className="text-slate-500 block text-[11px]">
                    {resource.owner.role}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Building2 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-800 block truncate">
                    {resource.owner.department}
                  </span>
                  <span className="text-slate-500 block text-[11px]">
                    Office: {resource.owner.office}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-800 block">
                    Handover Hours
                  </span>
                  <span className="text-slate-500 block text-[11px]">
                    {resource.owner.hours}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Trusted Sharing & Custody Rules */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
            <span className="font-bold text-slate-700 block">
              Fair Sharing & Custody Guidelines:
            </span>
            <ul className="space-y-1 text-slate-600">
              {resource.usageGuidelines.map((rule, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-slate-400">•</span>
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Modal>

      {/* Direct Verification Request Modal */}
      <VerificationRequestModal
        isOpen={isClearanceModalOpen}
        onClose={() => setIsClearanceModalOpen(false)}
        initialResourceId={resource.id}
        initialRequirementType={resource.trainingRequirement}
        onSuccess={() => {
          setClearanceStatus('Pending Review');
        }}
      />
    </>
  );
};
