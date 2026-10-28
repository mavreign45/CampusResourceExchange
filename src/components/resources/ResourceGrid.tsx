import React from 'react';
import { Resource } from '../../types/resource';
import { ResourceCard } from './ResourceCard';
import { EmptyState } from '../ui/EmptyState';

interface ResourceGridProps {
  resources: Resource[];
  totalResourcesCount: number;
  onViewDetails: (resource: Resource) => void;
  isSaved?: (id: string) => boolean;
  onToggleSave?: (id: string) => void;
  onResetFilters: () => void;
}

export const ResourceGrid: React.FC<ResourceGridProps> = ({
  resources,
  totalResourcesCount,
  onViewDetails,
  isSaved,
  onToggleSave,
  onResetFilters,
}) => {
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
    <div className="space-y-4">
      {/* Results Count Bar */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          Showing{' '}
          <strong className="text-slate-900 font-semibold">{resources.length}</strong> of{' '}
          <strong className="text-slate-900 font-semibold">{totalResourcesCount}</strong> campus
          resources
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
    </div>
  );
};
