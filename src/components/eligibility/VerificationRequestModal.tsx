import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  FileCheck2,
  AlertCircle,
  CheckCircle2,
  Send,
  BookOpen,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { eligibilityService } from '../../services/eligibilityService';
import { TrainingRequirementOption } from '../../types/auth';

interface VerificationRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialResourceId?: string;
  initialRequirementType?: string;
}

const FALLBACK_REQUIREMENTS: TrainingRequirementOption[] = [
  {
    id: 'laser-2',
    name: 'Laser Safety Level 2 Certification',
    department: 'Department of Electrical Engineering',
    description: 'Required for Class 3B and Class 4 laser equipment, optical benches, and high-energy diagnostic lasers.',
    validity_period: '1 academic year',
    prerequisites: ['General Lab Safety'],
  },
  {
    id: 'bsl-2',
    name: 'Biosafety Level 2 (BSL-2) Core Training',
    department: 'Department of Bioengineering',
    description: 'Required for centrifuges, incubators, biosafety cabinets, and cell culture suites.',
    validity_period: '2 academic years',
    prerequisites: ['Bloodborne Pathogens Standard'],
  },
  {
    id: 'cleanroom',
    name: 'Cleanroom Protocol & Fab Clearance',
    department: 'Nanotechnology & Microfabrication Lab',
    description: 'Mandatory gowning protocol, chemical vapor safety, and cleanroom access.',
    validity_period: '1 academic year',
    prerequisites: ['Hazardous Materials Handling'],
  },
  {
    id: 'rf-inst',
    name: 'High-Voltage & Precision RF Instrumentation Clearance',
    department: 'Robotics & Hardware Core Facility',
    description: 'Required for multi-channel RF analyzers, high-power oscilloscopes, and CNC machines.',
    validity_period: '1 academic year',
    prerequisites: ['Electrical Safety 101'],
  },
  {
    id: 'general-safety',
    name: 'General Campus Laboratory Safety & Compliance',
    department: 'Environmental Health & Safety (EHS)',
    description: 'Universal baseline safety clearance covering PPE, chemical spills, and emergency protocols.',
    validity_period: 'Indefinite',
    prerequisites: [],
  },
];

export const VerificationRequestModal: React.FC<VerificationRequestModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialResourceId,
  initialRequirementType,
}) => {
  const [requirements, setRequirements] = useState<TrainingRequirementOption[]>(FALLBACK_REQUIREMENTS);
  const [selectedType, setSelectedType] = useState<string>(
    initialRequirementType || FALLBACK_REQUIREMENTS[0].name
  );
  const [resourceId, setResourceId] = useState<string>(initialResourceId || '');
  const [evidenceDetails, setEvidenceDetails] = useState<string>('');

  const [loadingReqs, setLoadingReqs] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  // Sync initial props
  useEffect(() => {
    if (initialRequirementType) setSelectedType(initialRequirementType);
    if (initialResourceId) setResourceId(initialResourceId);
  }, [initialRequirementType, initialResourceId]);

  // Load requirements from API
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    setLoadingReqs(true);

    eligibilityService
      .getTrainingRequirements()
      .then((data) => {
        if (isMounted && data && data.length > 0) {
          setRequirements(data);
          if (!initialRequirementType) {
            setSelectedType(data[0].name);
          }
        }
      })
      .catch(() => {
        // Fall back gracefully to preset list
      })
      .finally(() => {
        if (isMounted) setLoadingReqs(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, initialRequirementType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType.trim()) {
      setError('Please select or specify a training requirement type.');
      return;
    }
    if (!evidenceDetails.trim()) {
      setError('Please provide evidence or documentation details (e.g. certificate number, workshop date).');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      await eligibilityService.submitRequest({
        requirement_type: selectedType.trim(),
        resource_id: resourceId.trim() || undefined,
        evidence_details: evidenceDetails.trim(),
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setEvidenceDetails('');
        onClose();
        if (onSuccess) onSuccess();
      }, 1400);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit verification request';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedRequirementMeta = requirements.find((r) => r.name === selectedType);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="lg"
      title={
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-campus-50 text-cyan-700 flex items-center justify-center border border-cyan-200">
            <FileCheck2 className="w-4 h-4 text-cyan-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Apply for Training Clearance
            </h3>
            <p className="text-xs text-slate-500 font-normal">
              Submit proof of lab orientation or certification for custodian approval
            </p>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Policy notice */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-slate-800">Trusted Campus Protocol:</strong> High-precision
            and specialized laboratory resources require verified safety training. Once submitted, your
            application enters the review queue for lab custodians.
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div
            className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2"
            role="alert"
          >
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* Success notification */}
        {success && (
          <div
            className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-start gap-2"
            role="status"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span className="leading-relaxed">
              Verification application submitted successfully! Reviewers will be notified.
            </span>
          </div>
        )}

        {/* Certification Type Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Training / Clearance Requirement Type *
          </label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            disabled={loadingReqs || submitting}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:bg-white"
          >
            {requirements.map((req) => (
              <option key={req.id} value={req.name}>
                {req.name} ({req.department})
              </option>
            ))}
            <option value="Custom Training Clearance">
              Other / Custom Departmental Protocol
            </option>
          </select>
          {selectedRequirementMeta && (
            <div className="mt-1.5 p-2.5 bg-cyan-50/50 border border-cyan-100 rounded-lg text-[11px] text-slate-600 space-y-1">
              <div className="flex items-center gap-1 font-semibold text-cyan-900">
                <BookOpen className="w-3 h-3 text-cyan-600" />
                <span>Valid for: {selectedRequirementMeta.validity_period}</span>
              </div>
              <p>{selectedRequirementMeta.description}</p>
            </div>
          )}
        </div>

        {/* Associated Resource (optional) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Associated Resource ID (Optional)
          </label>
          <input
            type="text"
            value={resourceId}
            onChange={(e) => setResourceId(e.target.value)}
            placeholder="e.g. res-osc-01 or leave blank for general clearance"
            disabled={submitting}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:bg-white"
          />
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            If applying for access to specific equipment, linking the resource expedites clearance.
          </span>
        </div>

        {/* Evidence details / Certificate info */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Evidence & Documentation Details *
          </label>
          <textarea
            required
            rows={3}
            value={evidenceDetails}
            onChange={(e) => setEvidenceDetails(e.target.value)}
            placeholder="e.g., Completed workshop with Dr. Vance on Oct 14, 2026. LMS Certificate ID: #CERT-8849-BIO."
            disabled={submitting}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:bg-white resize-y"
          />
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            Provide verifiable details so the lab custodian can approve without delay.
          </span>
        </div>

        {/* Buttons */}
        <div className="pt-2 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={submitting || success}
            className="bg-navy-900 hover:bg-slate-800 text-white min-w-[140px]"
            icon={<Send className="w-3.5 h-3.5 text-cyan-400" />}
          >
            {submitting ? 'Submitting...' : 'Submit Request'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
