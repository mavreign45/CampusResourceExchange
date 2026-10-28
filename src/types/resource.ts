export type ResourceCategory =
  | 'Laboratory Equipment'
  | 'Computers & Electronics'
  | 'Cameras & Media'
  | 'Engineering Tools'
  | 'Presentation Equipment'
  | 'Other Resources';

export type ResourceStatus = 'available' | 'in_use' | 'maintenance';

export interface ResourceOwner {
  name: string;
  department: string;
  role: string;
  email: string;
  office: string;
  hours: string;
}

export interface ResourceLocation {
  building: string;
  room: string;
  campusZone?: string;
  description?: string;
}

export interface Resource {
  id: string;
  name: string;
  modelNumber?: string;
  category: ResourceCategory;
  categoryId?: number;
  shortDescription: string;
  fullDescription: string;
  imageUrl: string;
  location: ResourceLocation;
  status: ResourceStatus;
  estimatedAvailableDate?: string;
  requiresVerification: boolean;
  requiresTraining?: boolean;
  requiresSupervision?: boolean;
  trainingRequirement?: string;
  eligibility: string;
  maxBorrowHours?: number;
  maxBorrowDuration: string;
  owner: ResourceOwner;
  specifications: string[];
  usageGuidelines: string[];
  itemCondition: 'Like New' | 'Good' | 'Fair';
  accessoriesIncluded: string[];
}

export interface ResourceFilterState {
  searchQuery: string;
  category: ResourceCategory | 'All';
  status: ResourceStatus | 'All';
  location: string | 'All';
  sortBy: 'name-asc' | 'name-desc' | 'availability' | 'category';
}

export interface ResourceSummaryStats {
  total: number;
  available: number;
  inUse: number;
  maintenance: number;
  categoriesCount: number;
  requiresVerificationCount: number;
  isBackendGenerated?: boolean;
}

// Backend API Data Transfer Objects (DTOs)
export interface ApiCategory {
  id: number;
  name: string;
  description?: string;
  created_at?: string;
}

export interface ApiLocation {
  id: number;
  building: string;
  room: string;
  campus_zone?: string;
  description?: string;
  created_at?: string;
}

export interface ApiCustodian {
  id: number;
  name: string;
  department: string;
  role?: string;
  contact_email: string;
  office?: string;
  hours?: string;
  created_at?: string;
}

export interface ApiResource {
  id: string;
  name: string;
  model_number?: string;
  short_description: string;
  description: string;
  image_url: string;
  category_id: number;
  category?: ApiCategory;
  location_id: number;
  location?: ApiLocation;
  custodian_id: number;
  custodian?: ApiCustodian;
  availability_status: string;
  estimated_available_date?: string;
  requires_verification: boolean;
  requires_training: boolean;
  requires_supervision: boolean;
  training_requirement?: string;
  eligibility?: string;
  max_borrow_hours: number;
  max_borrow_duration?: string;
  item_condition: string;
  specifications?: string[];
  accessories_included?: string[];
  usage_guidelines?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface ApiResourceListResponse {
  items: ApiResource[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ApiResourceSummaryResponse {
  total_resources: number;
  available_now: number;
  category_count: number;
  requires_verification: number;
}

export interface FetchResourcesQueryParams {
  search?: string;
  category?: string;
  availability?: string;
  building?: string;
  sort_by?: 'name' | 'category' | 'availability' | 'created_at';
  sort_order?: 'asc' | 'desc';
  page?: number;
  page_size?: number;
}
