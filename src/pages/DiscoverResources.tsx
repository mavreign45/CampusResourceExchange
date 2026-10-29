import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  AlertCircle,
  RefreshCw,
  ServerOff,
  Database,
  ArrowRight,
} from 'lucide-react';
import {
  Resource,
  ResourceFilterState,
  ResourceSummaryStats,
} from '../types/resource';
import { ResourceSummaryCards } from '../components/resources/ResourceSummaryCards';
import { ResourceSearch } from '../components/resources/ResourceSearch';
import { ResourceFilters } from '../components/resources/ResourceFilters';
import { ResourceGrid } from '../components/resources/ResourceGrid';
import { ResourceDetailsModal } from '../components/resources/ResourceDetailsModal';
import { Button } from '../components/ui/Button';
import {
  fetchResources,
  fetchResourceById,
  fetchResourceSummary,
} from '../services/resourceService';
import { INITIAL_MOCK_RESOURCES, computeSummaryStats } from '../data/mockResources';

interface DiscoverResourcesProps {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  savedResourceIds: Set<string>;
  onToggleSaveResource: (id: string) => void;
  onResourcesLoaded?: (resources: Resource[]) => void;
  onOpenAuthModal?: () => void;
}

export const DiscoverResources: React.FC<DiscoverResourcesProps> = ({
  searchQuery,
  onSearchQueryChange,
  savedResourceIds,
  onToggleSaveResource,
  onResourcesLoaded,
  onOpenAuthModal,
}) => {
  // Data states
  const [resources, setResources] = useState<Resource[]>([]);
  const [summaryStats, setSummaryStats] = useState<ResourceSummaryStats | null>(null);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isFallbackMode, setIsFallbackMode] = useState<boolean>(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Client filter state
  const [filters, setFilters] = useState<ResourceFilterState>({
    searchQuery: searchQuery || '',
    category: 'All',
    status: 'All',
    location: 'All',
    sortBy: 'name-asc',
  });

  // Keep search in sync
  useEffect(() => {
    setFilters((prev) => ({ ...prev, searchQuery }));
  }, [searchQuery]);

  // Primary backend loading function
  const loadData = useCallback(
    async (pageToLoad: number = currentPage) => {
      setIsLoading(true);
      setError(null);

      // Parse sorting
      let sortByField: 'name' | 'category' | 'availability' | 'created_at' = 'name';
      let sortOrder: 'asc' | 'desc' = 'asc';

      if (filters.sortBy === 'name-asc') {
        sortByField = 'name';
        sortOrder = 'asc';
      } else if (filters.sortBy === 'name-desc') {
        sortByField = 'name';
        sortOrder = 'desc';
      } else if (filters.sortBy === 'availability') {
        sortByField = 'availability';
        sortOrder = 'asc';
      } else if (filters.sortBy === 'category') {
        sortByField = 'category';
        sortOrder = 'asc';
      }

      try {
        const [resourceData, summaryData] = await Promise.all([
          fetchResources({
            search: filters.searchQuery || undefined,
            category: filters.category !== 'All' ? filters.category : undefined,
            availability: filters.status !== 'All' ? filters.status : undefined,
            building: filters.location !== 'All' ? filters.location : undefined,
            sort_by: sortByField,
            sort_order: sortOrder,
            page: pageToLoad,
            page_size: 12,
          }),
          fetchResourceSummary().catch(() => null),
        ]);

        setResources(resourceData.resources);
        setTotalCount(resourceData.total);
        setTotalPages(resourceData.totalPages);
        setCurrentPage(resourceData.page);
        setIsFallbackMode(false);

        if (summaryData) {
          setSummaryStats(summaryData);
        } else {
          setSummaryStats(computeSummaryStats(resourceData.resources));
        }

        if (onResourcesLoaded) {
          onResourcesLoaded(resourceData.resources);
        }
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : 'Failed to connect to API backend.';
        setError(errMsg);
      } finally {
        setIsLoading(false);
      }
    },
    [filters, currentPage, onResourcesLoaded]
  );

  // Trigger load on filter or search changes
  useEffect(() => {
    loadData(1);
  }, [filters.searchQuery, filters.category, filters.status, filters.location, filters.sortBy]);

  // Handle explicit switch to offline fallback if backend is down
  const enableExplicitFallback = () => {
    setIsFallbackMode(true);
    setError(null);
    setResources(INITIAL_MOCK_RESOURCES);
    setTotalCount(INITIAL_MOCK_RESOURCES.length);
    setTotalPages(1);
    setCurrentPage(1);
    const mockStats = computeSummaryStats(INITIAL_MOCK_RESOURCES);
    setSummaryStats({ ...mockStats, isBackendGenerated: false });
    if (onResourcesLoaded) {
      onResourcesLoaded(INITIAL_MOCK_RESOURCES);
    }
  };

  // Open resource detail modal and fetch fresh single resource from API
  const handleOpenDetails = async (resource: Resource) => {
    setSelectedResource(resource);
    if (!isFallbackMode) {
      try {
        const freshDetails = await fetchResourceById(resource.id);
        setSelectedResource(freshDetails);
      } catch {
        // Fall back to pre-fetched card data if network blip occurs
      }
    }
  };

  const handleCloseDetails = () => {
    setSelectedResource(null);
  };

  // Available campus buildings list
  const uniqueLocations = useMemo(() => {
    const defaultBuildings = [
      'Turing Engineering Hall',
      'Media Arts Center',
      'Makerspace Innovation Hub',
      'Linus Torvalds Computer Science Complex',
      'Materials Science Research Center',
      'Student Union & Conference Center',
      'Biomedical & Life Sciences Center',
      'Robotics & Advanced Manufacturing Pavilion',
    ];
    const fromLoaded = resources.map((r) => r.location.building);
    return Array.from(new Set([...defaultBuildings, ...fromLoaded])).sort();
  }, [resources]);

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.searchQuery.trim() !== '') count++;
    if (filters.category !== 'All') count++;
    if (filters.status !== 'All') count++;
    if (filters.location !== 'All') count++;
    if (filters.sortBy !== 'name-asc') count++;
    return count;
  }, [filters]);

  const handleResetFilters = () => {
    setFilters({
      searchQuery: '',
      category: 'All',
      status: 'All',
      location: 'All',
      sortBy: 'name-asc',
    });
    onSearchQueryChange('');
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Explicit Backend Fallback Notice Banner */}
      {isFallbackMode && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <div className="text-xs">
              <span className="font-bold block text-sm">
                Explicit Offline Preview Mode
              </span>
              <span>
                Displaying local simulated dataset. Results are <strong>not synced with PostgreSQL</strong>.
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadData(1)}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Reconnect to FastAPI
          </Button>
        </div>
      )}

      {/* Backend Connection Error State Banner */}
      {error && !isFallbackMode && (
        <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 shadow-xs space-y-3">
          <div className="flex items-start gap-3">
            <ServerOff className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-rose-950">
                Backend Service Connection Error
              </h3>
              <p className="text-xs text-rose-800 mt-1 leading-relaxed">
                Could not connect to the FastAPI server: <code className="bg-rose-100 px-1 py-0.5 rounded font-mono text-[11px]">{error}</code>.
                Please ensure the backend server is running (<code className="bg-rose-100 px-1 py-0.5 rounded font-mono text-[11px]">uvicorn app.main:app --reload</code>).
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-rose-200/60">
            <Button
              variant="primary"
              size="sm"
              onClick={() => loadData(1)}
              icon={<RefreshCw className="w-3.5 h-3.5" />}
              className="bg-rose-900 hover:bg-rose-950 text-white"
            >
              Retry Connection
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={enableExplicitFallback}
              iconRight={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Switch to Offline Preview Mode
            </Button>
          </div>
        </div>
      )}

      {/* Page Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-navy-950 via-slate-900 to-navy-900 rounded-2xl p-6 sm:p-8 text-white border border-slate-800 shadow-card">
        <div className="absolute top-0 right-0 w-80 h-80 bg-campus-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span>Campus Resource Exchange • Live Catalog</span>
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
              value={filters.searchQuery}
              onChange={(val) => {
                onSearchQueryChange(val);
                setFilters((prev) => ({ ...prev, searchQuery: val }));
              }}
              placeholder="Search across PostgreSQL catalog by name, model, department, or lab room..."
              className="shadow-lg"
            />
          </div>
        </div>
      </div>

      {/* Summary Metrics Cards */}
      {summaryStats && (
        <section aria-labelledby="summary-stats-heading">
          <h2 id="summary-stats-heading" className="sr-only">
            Resource Inventory Metrics
          </h2>
          <ResourceSummaryCards stats={summaryStats} />
        </section>
      )}

      {/* Main Catalog Filtering and Cards Section */}
      <section className="space-y-6" aria-labelledby="catalog-heading">
        <div className="flex items-center justify-between">
          <div>
            <h2 id="catalog-heading" className="text-lg font-bold text-slate-900">
              Available Resources Catalog
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Filtered in real-time via PostgreSQL REST API with server-side pagination.
            </p>
          </div>
        </div>

        {/* Category & Advanced Filter Bar */}
        <ResourceFilters
          filters={filters}
          uniqueLocations={uniqueLocations}
          activeFilterCount={activeFilterCount}
          onCategoryChange={(cat) => setFilters((prev) => ({ ...prev, category: cat }))}
          onStatusChange={(st) => setFilters((prev) => ({ ...prev, status: st }))}
          onLocationChange={(loc) => setFilters((prev) => ({ ...prev, location: loc }))}
          onSortChange={(sb) => setFilters((prev) => ({ ...prev, sortBy: sb }))}
          onReset={handleResetFilters}
        />

        {/* Resources Grid with Loading and Pagination */}
        <ResourceGrid
          resources={resources}
          totalResourcesCount={totalCount}
          onViewDetails={handleOpenDetails}
          isSaved={(id) => savedResourceIds.has(id)}
          onToggleSave={onToggleSaveResource}
          onResetFilters={handleResetFilters}
          isLoading={isLoading}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(newPage) => {
            setCurrentPage(newPage);
            loadData(newPage);
            window.scrollTo({ top: 400, behavior: 'smooth' });
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
        onOpenAuthModal={onOpenAuthModal}
      />
    </div>
  );
};
