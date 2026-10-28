import { useMemo, useState } from 'react';
import { Resource, ResourceCategory, ResourceFilterState, ResourceStatus } from '../types/resource';

const INITIAL_FILTERS: ResourceFilterState = {
  searchQuery: '',
  category: 'All',
  status: 'All',
  location: 'All',
  sortBy: 'name-asc',
};

export function useResourceFilters(resources: Resource[]) {
  const [filters, setFilters] = useState<ResourceFilterState>(INITIAL_FILTERS);

  // Extract unique building locations for location filter dropdown
  const uniqueLocations = useMemo(() => {
    const set = new Set(resources.map((r) => r.location.building));
    return Array.from(set).sort();
  }, [resources]);

  // Combined filtered and sorted resources
  const filteredResources = useMemo(() => {
    return resources
      .filter((resource) => {
        // Search query filter (name, description, model, department, room)
        if (filters.searchQuery.trim()) {
          const query = filters.searchQuery.toLowerCase().trim();
          const matchesName = resource.name.toLowerCase().includes(query);
          const matchesDesc = resource.shortDescription.toLowerCase().includes(query) ||
                              resource.fullDescription.toLowerCase().includes(query);
          const matchesModel = resource.modelNumber?.toLowerCase().includes(query) ?? false;
          const matchesDept = resource.owner.department.toLowerCase().includes(query);
          const matchesBuilding = resource.location.building.toLowerCase().includes(query);
          const matchesRoom = resource.location.room.toLowerCase().includes(query);

          if (!matchesName && !matchesDesc && !matchesModel && !matchesDept && !matchesBuilding && !matchesRoom) {
            return false;
          }
        }

        // Category filter
        if (filters.category !== 'All' && resource.category !== filters.category) {
          return false;
        }

        // Status filter
        if (filters.status !== 'All' && resource.status !== filters.status) {
          return false;
        }

        // Location filter
        if (filters.location !== 'All' && resource.location.building !== filters.location) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        switch (filters.sortBy) {
          case 'name-asc':
            return a.name.localeCompare(b.name);
          case 'name-desc':
            return b.name.localeCompare(a.name);
          case 'availability': {
            // Prioritize 'available' over 'in_use' over 'maintenance'
            const statusOrder: Record<ResourceStatus, number> = {
              available: 1,
              in_use: 2,
              maintenance: 3,
            };
            const diff = statusOrder[a.status] - statusOrder[b.status];
            return diff !== 0 ? diff : a.name.localeCompare(b.name);
          }
          case 'category':
            return a.category.localeCompare(b.category) || a.name.localeCompare(b.name);
          default:
            return 0;
        }
      });
  }, [resources, filters]);

  // Calculate active filter count (excluding default sortBy)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.searchQuery.trim() !== '') count++;
    if (filters.category !== 'All') count++;
    if (filters.status !== 'All') count++;
    if (filters.location !== 'All') count++;
    if (filters.sortBy !== 'name-asc') count++;
    return count;
  }, [filters]);

  const setSearchQuery = (query: string) => {
    setFilters((prev) => ({ ...prev, searchQuery: query }));
  };

  const setCategory = (category: ResourceCategory | 'All') => {
    setFilters((prev) => ({ ...prev, category }));
  };

  const setStatus = (status: ResourceStatus | 'All') => {
    setFilters((prev) => ({ ...prev, status }));
  };

  const setLocation = (location: string | 'All') => {
    setFilters((prev) => ({ ...prev, location }));
  };

  const setSortBy = (sortBy: ResourceFilterState['sortBy']) => {
    setFilters((prev) => ({ ...prev, sortBy }));
  };

  const resetFilters = () => {
    setFilters(INITIAL_FILTERS);
  };

  return {
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
  };
}
