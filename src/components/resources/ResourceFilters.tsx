import React from 'react';
import { RotateCcw, MapPin, CheckCircle, ArrowDownUp } from 'lucide-react';
import { ResourceCategory, ResourceFilterState, ResourceStatus } from '../../types/resource';
import { CATEGORIES } from '../../data/mockResources';

interface ResourceFiltersProps {
  filters: ResourceFilterState;
  uniqueLocations: string[];
  activeFilterCount: number;
  onCategoryChange: (category: ResourceCategory | 'All') => void;
  onStatusChange: (status: ResourceStatus | 'All') => void;
  onLocationChange: (location: string | 'All') => void;
  onSortChange: (sortBy: ResourceFilterState['sortBy']) => void;
  onReset: () => void;
}

export const ResourceFilters: React.FC<ResourceFiltersProps> = ({
  filters,
  uniqueLocations,
  activeFilterCount,
  onCategoryChange,
  onStatusChange,
  onLocationChange,
  onSortChange,
  onReset,
}) => {
  return (
    <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200/90 shadow-subtle">
      {/* Category Filter Pills */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Categories
          </label>
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1 text-xs font-medium text-campus-700 hover:text-campus-900 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Reset all ({activeFilterCount})
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by category">
          <button
            type="button"
            onClick={() => onCategoryChange('All')}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
              filters.category === 'All'
                ? 'bg-navy-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
            }`}
          >
            All Resources
          </button>
          {CATEGORIES.map((cat) => {
            const isSelected = filters.category === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => onCategoryChange(cat)}
                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
                  isSelected
                    ? 'bg-navy-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Secondary Filters & Sorting Controls Bar */}
      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3">
        {/* Availability Select */}
        <div className="flex items-center gap-1.5 text-xs text-slate-600 min-w-[170px] flex-1 sm:flex-initial">
          <CheckCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <label htmlFor="filter-status" className="sr-only">
            Filter by Availability
          </label>
          <select
            id="filter-status"
            value={filters.status}
            onChange={(e) => onStatusChange(e.target.value as ResourceStatus | 'All')}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-campus-500 focus:bg-white transition-colors"
          >
            <option value="All">All Availabilities</option>
            <option value="available">Available Now</option>
            <option value="in_use">Currently In Use</option>
            <option value="maintenance">Under Maintenance</option>
          </select>
        </div>

        {/* Location Select */}
        <div className="flex items-center gap-1.5 text-xs text-slate-600 min-w-[190px] flex-1 sm:flex-initial">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <label htmlFor="filter-location" className="sr-only">
            Filter by Building
          </label>
          <select
            id="filter-location"
            value={filters.location}
            onChange={(e) => onLocationChange(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-campus-500 focus:bg-white transition-colors"
          >
            <option value="All">All Campus Buildings</option>
            {uniqueLocations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-1.5 text-xs text-slate-600 min-w-[180px] sm:ml-auto flex-1 sm:flex-initial">
          <ArrowDownUp className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <label htmlFor="sort-by" className="sr-only">
            Sort Resources
          </label>
          <select
            id="sort-by"
            value={filters.sortBy}
            onChange={(e) => onSortChange(e.target.value as ResourceFilterState['sortBy'])}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-campus-500 focus:bg-white transition-colors"
          >
            <option value="name-asc">Sort: Name (A to Z)</option>
            <option value="name-desc">Sort: Name (Z to A)</option>
            <option value="availability">Sort: Available First</option>
            <option value="category">Sort: Category</option>
          </select>
        </div>
      </div>
    </div>
  );
};
