import { apiClient } from './api';
import {
  Resource,
  ResourceCategory,
  ResourceStatus,
  ApiResource,
  ApiResourceListResponse,
  ApiResourceSummaryResponse,
  ResourceSummaryStats,
  FetchResourcesQueryParams,
} from '../types/resource';

/**
 * Transforms backend ApiResource entity into frontend Resource model.
 */
export function transformApiResourceToResource(api: ApiResource): Resource {
  // Normalize category
  const categoryName = (api.category?.name || 'Other Resources') as ResourceCategory;

  // Normalize status
  let status: ResourceStatus = 'available';
  if (api.availability_status === 'in_use') {
    status = 'in_use';
  } else if (api.availability_status === 'maintenance' || api.availability_status === 'unavailable') {
    status = 'maintenance';
  }

  // Normalize condition
  const validConditions = ['Like New', 'Good', 'Fair'] as const;
  const condition = validConditions.includes(api.item_condition as 'Like New' | 'Good' | 'Fair')
    ? (api.item_condition as 'Like New' | 'Good' | 'Fair')
    : 'Good';

  return {
    id: api.id,
    name: api.name,
    modelNumber: api.model_number,
    category: categoryName,
    categoryId: api.category_id,
    shortDescription: api.short_description,
    fullDescription: api.description,
    imageUrl: api.image_url,
    location: {
      building: api.location?.building || 'Campus Facility',
      room: api.location?.room || 'Main Suite',
      campusZone: api.location?.campus_zone || 'Campus',
      description: api.location?.description,
    },
    status: status,
    estimatedAvailableDate: api.estimated_available_date,
    requiresVerification: api.requires_verification,
    requiresTraining: api.requires_training,
    requiresSupervision: api.requires_supervision,
    trainingRequirement: api.training_requirement,
    eligibility: api.eligibility || 'Open to all registered university students.',
    maxBorrowHours: api.max_borrow_hours,
    maxBorrowDuration:
      api.max_borrow_duration ||
      (api.max_borrow_hours ? `${api.max_borrow_hours} Hours` : '24 Hours'),
    owner: {
      name: api.custodian?.name || 'Department Custodian',
      department: api.custodian?.department || 'Academic Department',
      role: api.custodian?.role || 'Equipment Liaison',
      email: api.custodian?.contact_email || 'custodian@university.example.edu',
      office: api.custodian?.office || 'Department Office',
      hours: api.custodian?.hours || 'Mon-Fri 9:00 AM - 5:00 PM',
    },
    specifications: api.specifications || [],
    accessoriesIncluded: api.accessories_included || [],
    usageGuidelines: api.usage_guidelines || [],
    itemCondition: condition,
  };
}

/**
 * Fetch paginated, filtered resources from the FastAPI backend.
 */
export async function fetchResources(
  params: FetchResourcesQueryParams = {}
): Promise<{
  resources: Resource[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const searchParams = new URLSearchParams();

  if (params.search && params.search.trim()) {
    searchParams.set('search', params.search.trim());
  }
  if (params.category && params.category !== 'All') {
    searchParams.set('category', params.category);
  }
  if (params.availability && params.availability !== 'All') {
    searchParams.set('availability', params.availability);
  }
  if (params.building && params.building !== 'All') {
    searchParams.set('building', params.building);
  }
  if (params.sort_by) {
    searchParams.set('sort_by', params.sort_by);
  }
  if (params.sort_order) {
    searchParams.set('sort_order', params.sort_order);
  }
  if (params.page) {
    searchParams.set('page', String(params.page));
  }
  if (params.page_size) {
    searchParams.set('page_size', String(params.page_size));
  }

  const queryStr = searchParams.toString();
  const endpoint = queryStr ? `/resources?${queryStr}` : '/resources';

  const response = await apiClient<ApiResourceListResponse>(endpoint);

  return {
    resources: response.items.map(transformApiResourceToResource),
    total: response.total,
    page: response.page,
    pageSize: response.page_size,
    totalPages: response.total_pages,
  };
}

/**
 * Fetch a single resource's full details by ID from the FastAPI backend.
 */
export async function fetchResourceById(id: string): Promise<Resource> {
  const apiResource = await apiClient<ApiResource>(`/resources/${encodeURIComponent(id)}`);
  return transformApiResourceToResource(apiResource);
}

/**
 * Fetch catalog summary metrics calculated directly from the database.
 */
export async function fetchResourceSummary(): Promise<ResourceSummaryStats> {
  const summary = await apiClient<ApiResourceSummaryResponse>('/resources/summary');
  return {
    total: summary.total_resources,
    available: summary.available_now,
    inUse: 0,
    maintenance: 0,
    categoriesCount: summary.category_count,
    requiresVerificationCount: summary.requires_verification,
    isBackendGenerated: true,
  };
}

/**
 * Check backend API health and database connectivity.
 */
export async function checkBackendHealth(): Promise<{ status: string; database: string }> {
  return await apiClient<{ status: string; database: string }>('/health');
}
