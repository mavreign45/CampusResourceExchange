import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Resource, ResourceSummaryStats } from '../types/resource';
import { ResourceSummaryCards } from '../components/resources/ResourceSummaryCards';
import { ResourceSearch } from '../components/resources/ResourceSearch';
import { ResourceFilters } from '../components/resources/ResourceFilters';
import { ResourceGrid } from '../components/resources/ResourceGrid';
import { ResourceDetailsModal } from '../components/resources/ResourceDetailsModal';
import { useResourceFilters } from '../hooks/useResourceFilters';
import { computeSummaryStats } from '../data/mockResources';

interface DiscoverResourcesProps {
  resources: Resource[];
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  savedResourceIds: Set<string>;
  onToggleSaveResource: (id: string) => void;
}

export const DiscoverResources: React.FC<DiscoverResourcesProps> = ({
  resources,
  searchQuery,
  onSearchQueryChange,
  savedResourceIds,
  onToggleSaveResource,
}) => {
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);

  // Compute live summary stats from resources data
  const summaryStats: ResourceSummaryStats = computeSummaryStats(resources);

  // Filter & sorting hook
  const {
    filters,
    filteredResources,
    uniqueLocations,
    activeFilterCount,
    setSearchQuery,
    setCategory,
    setStatus,
    setLocation,
    setSortBy,
    resetFilters,
  } = useResourceFilters(resources);

  // Sync external search query (from header or local) with hook
  const handleSearchChange = (query: string) => {
    onSearchQueryChange(query);
    setSearchQuery(query);
  };

  const handleOpenDetails = (resource: Resource) => {
    setSelectedResource(resource);
  };

  const handleCloseDetails = () => {
    setSelectedResource(null);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-navy-950 via-slate-900 to-navy-900 rounded-2xl p-6 sm:p-8 text-white border border-slate-800 shadow-card">
        {/* Subtle decorative background glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-campus-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Campus Resource Exchange • Phase 1 Prototype</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Discover Campus Resources
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
            Discover underused laboratory equipment, camera rigs, engineering workstations, and prototyping tools available across campus departments for research, capstones, and innovative student projects.
          </p>

          {/* Prominent Search Field in Header */}
          <div className="pt-3 max-w-2xl">
            <ResourceSearch
              value={filters.searchQuery || searchQuery}
              onChange={handleSearchChange}
              placeholder="Search by equipment name, manufacturer model, department, or lab room..."
              className="shadow-lg"
            />
          </div>
        </div>
      </div>

      {/* Summary Metrics Cards */}
      <section aria-labelledby="summary-stats-heading">
        <h2 id="summary-stats-heading" className="sr-only">
          Resource Inventory Metrics
        </h2>
        <ResourceSummaryCards stats={summaryStats} />
      </section>

      {/* Main Catalog Filtering and Cards Section */}
      <section className="space-y-6" aria-labelledby="catalog-heading">
        <div className="flex items-center justify-between">
          <div>
            <h2 id="catalog-heading" className="text-lg font-bold text-slate-900">
              Available Resources Catalog
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Filter by department category, real-time availability, and campus building.
            </p>
          </div>
        </div>

        {/* Category & Advanced Filter Bar */}
        <ResourceFilters
          filters={filters}
          uniqueLocations={uniqueLocations}
          activeFilterCount={activeFilterCount}
          onCategoryChange={setCategory}
          onStatusChange={setStatus}
          onLocationChange={setLocation}
          onSortChange={setSortBy}
          onReset={() => {
            resetFilters();
            onSearchQueryChange('');
          }}
        />

        {/* Resources Grid */}
        <ResourceGrid
          resources={filteredResources}
          totalResourcesCount={resources.length}
          onViewDetails={handleOpenDetails}
          isSaved={(id) => savedResourceIds.has(id)}
          onToggleSave={onToggleSaveResource}
          onResetFilters={() => {
            resetFilters();
            onSearchQueryChange('');
          }}
        />
      </section>

      {/* Resource Detail Modal */}
      <ResourceDetailsModal
        resource={selectedResource}
        isOpen={Boolean(selectedResource)}
        onClose={handleCloseDetails}
        isSaved={selectedResource ? savedResourceIds.has(selectedResource.id) : false}
        onToggleSave={onToggleSaveResource}
      />
    </div>
  );
};
