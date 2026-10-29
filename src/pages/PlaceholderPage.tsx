import React from 'react';
import {
  FileClock,
  CalendarCheck,
  Bookmark,
  LayoutDashboard,
  Settings,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { NavigationPage } from '../components/layout/AppSidebar';
import { Button } from '../components/ui/Button';
import { Resource } from '../types/resource';
import { ResourceGrid } from '../components/resources/ResourceGrid';
import { ResourceDetailsModal } from '../components/resources/ResourceDetailsModal';

interface PlaceholderPageProps {
  page: NavigationPage;
  onNavigateToDiscover: () => void;
  savedResources?: Resource[];
  savedResourceIds?: Set<string>;
  onToggleSaveResource?: (id: string) => void;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({
  page,
  onNavigateToDiscover,
  savedResources = [],
  savedResourceIds = new Set(),
  onToggleSaveResource,
}) => {
  const [selectedResource, setSelectedResource] = React.useState<Resource | null>(null);

  // If page is 'saved', provide a real functional saved list!
  if (page === 'saved') {
    return (
      <div className="space-y-6 pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 bg-white rounded-2xl border border-slate-200 shadow-subtle">
          <div>
            <div className="flex items-center gap-2 text-campus-700 text-xs font-semibold mb-1">
              <Bookmark className="w-4 h-4 fill-current" />
              <span>Personal Saved Catalog</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900">
              Saved Campus Resources ({savedResources.length})
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Bookmarks stored locally for quick access during your active session.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onNavigateToDiscover}
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            Browse All Resources
          </Button>
        </div>

        <ResourceGrid
          resources={savedResources}
          totalResourcesCount={savedResources.length}
          onViewDetails={(r) => setSelectedResource(r)}
          isSaved={(id) => savedResourceIds.has(id)}
          onToggleSave={onToggleSaveResource}
          onResetFilters={onNavigateToDiscover}
        />

        <ResourceDetailsModal
          resource={selectedResource}
          isOpen={Boolean(selectedResource)}
          onClose={() => setSelectedResource(null)}
          isSaved={selectedResource ? savedResourceIds.has(selectedResource.id) : false}
          onToggleSave={onToggleSaveResource}
        />
      </div>
    );
  }

  const getPageConfig = () => {
    switch (page) {
      case 'requests':
        return {
          title: 'My Access Requests',
          targetPhase: 'Request & Approval Engine',
          icon: <FileClock className="w-8 h-8 text-campus-600" />,
          description:
            'A transparent queue for tracking submitted resource requests, custodian review status, endorsement requirements, and reservation validity.',
          features: [
            'Real-time status updates: Pending, Approved, Waitlisted, or Returned',
            'Department supervisor and lab manager endorsement routing',
            'Automated email and in-app status notifications',
            'One-click request cancellation and rescheduling',
          ],
        };
      case 'bookings':
        return {
          title: 'My Active Bookings',
          targetPhase: 'Reservations & Handover Tracking',
          icon: <CalendarCheck className="w-8 h-8 text-teal-600" />,
          description:
            'Manage confirmed equipment reservations, upcoming pickup windows, QR code check-in handovers, and return deadlines.',
          features: [
            'Calendar timeline and conflict-free booking scheduler',
            'Digital handover verification via lab keycard or student QR code',
            'Automated return deadline reminders 24h & 2h before due time',
            'Extension request submission when no conflicting waitlist exists',
          ],
        };
      case 'dashboard':
        return {
          title: 'Lab Custodian & Department Dashboard',
          targetPhase: 'Lab Oversight & FairShare Analytics',
          icon: <LayoutDashboard className="w-8 h-8 text-cyan-600" />,
          description:
            'Administrative command center for lab managers and department chairs to monitor asset utilization, equipment health, and fair share quota enforcement.',
          features: [
            'Utilization heatmap across laboratory buildings and equipment classes',
            'FairShare allocation algorithm to prevent resource hoarding',
            'Maintenance scheduling and damage incident tracking logs',
            'CSV & audit report export for departmental accreditation',
          ],
        };
      case 'settings':
        return {
          title: 'Account, Roles & Training Certifications',
          targetPhase: 'Account & Training Settings',
          icon: <Settings className="w-8 h-8 text-slate-700" />,
          description:
            'Manage university SSO authentication, verified lab safety clearances, student organization affiliations, and communication preferences.',
          features: [
            'University SSO / OAuth integration with student directory',
            'Verified badges: Laser Safety, Biosafety Level 1, Machine Shop Clearance',
            'Role permissions: Student, Faculty Researcher, Lab Custodian, Admin',
            'Notification preferences (Email, Push, Calendar sync)',
          ],
        };
      default:
        return {
          title: 'Upcoming Feature',
          targetPhase: 'Platform Feature',
          icon: <Sparkles className="w-8 h-8 text-campus-600" />,
          description: 'This module is scheduled for release in an upcoming milestone.',
          features: ['Planned enhancement', 'Architecture ready for API integration'],
        };
    }
  };

  const config = getPageConfig();

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-8 sm:p-10 text-center">
        {/* Phase Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
          <span>{config.targetPhase}</span>
        </div>

        {/* Icon & Title */}
        <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-4 shadow-xs">
          {config.icon}
        </div>

        <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
          {config.title}
        </h1>

        <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed mb-8">
          {config.description}
        </p>

        {/* Planned Features List */}
        <div className="bg-slate-50 rounded-xl border border-slate-200/80 p-6 text-left max-w-lg mx-auto mb-8">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
            Planned Architecture & Capabilities:
          </h2>
          <ul className="space-y-2.5 text-xs text-slate-600">
            {config.features.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-600 shrink-0 mt-1.5" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Primary Action to return to Phase 1 Discover */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            variant="primary"
            size="md"
            onClick={onNavigateToDiscover}
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            Back to Discover Resources
          </Button>
        </div>
      </div>
    </div>
  );
};
