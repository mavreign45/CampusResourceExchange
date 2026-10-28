import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Resource } from '../../types/resource';
import { ResourceCard } from './ResourceCard';
import { EmptyState } from '../ui/EmptyState';
import { Button } from '../ui/Button';

interface ResourceGridProps {
  resources: Resource[];
  totalResourcesCount: number;
  onViewDetails: (resource: Resource) => void;
  isSaved?: (id: string) => boolean;
  onToggleSave?: (id: string) => void;
  onResetFilters: () => void;
  isLoading?: boolean;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

export const ResourceGrid: React.FC<ResourceGridProps> = ({
  resources,
  totalResourcesCount,
  onViewDetails,
  isSaved,
  onToggleSave,
  onResetFilters,
  isLoading = false,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
}) => {
  // Loading skeleton state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-4 w-48 bg-slate-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-subtle p-0 animate-pulse"
            >
              <div className="aspect-video bg-slate-200 w-full" />
              <div className="p-5 space-y-3">
                <div className="h-4 bg-slate-200 rounded w-3/4" />
                <div className="h-3 bg-slate-200 rounded w-full" />
                <div className="h-3 bg-slate-200 rounded w-2/3" />
                <div className="pt-4 border-t border-slate-100 flex justify-between">
                  <div className="h-4 bg-slate-200 rounded w-1/3" />
                  <div className="h-8 bg-slate-200 rounded w-1/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (resources.length === 0) {
    return (
      <EmptyState
        title="No matching campus resources"
        description="We couldn't find any resources that match your current search and filter selections. Try broadening your criteria or reset filters."
        actionLabel="Reset All Filters"
        onAction={onResetFilters}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Results Count Bar */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          Showing{' '}
          <strong className="text-slate-900 font-semibold">{resources.length}</strong> of{' '}
          <strong className="text-slate-900 font-semibold">{totalResourcesCount}</strong> campus
          resources
          {totalPages > 1 && (
            <span className="text-slate-400"> (Page {currentPage} of {totalPages})</span>
          )}
        </span>
      </div>

      {/* Responsive Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {resources.map((resource) => (
          <ResourceCard
            key={resource.id}
            resource={resource}
            onViewDetails={onViewDetails}
            isSaved={isSaved ? isSaved(resource.id) : false}
            onToggleSave={onToggleSave}
          />
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between pt-6 border-t border-slate-200">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            icon={<ChevronLeft className="w-4 h-4" />}
          >
            Previous
          </Button>

          <span className="text-xs font-medium text-slate-600">
            Page <strong className="text-slate-900">{currentPage}</strong> of{' '}
            <strong className="text-slate-900">{totalPages}</strong>
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
            iconRight={<ChevronRight className="w-4 h-4" />}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};
