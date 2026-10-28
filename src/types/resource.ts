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

export interface Resource {
  id: string;
  name: string;
  modelNumber?: string;
  category: ResourceCategory;
  shortDescription: string;
  fullDescription: string;
  imageUrl: string;
  location: {
    building: string;
    room: string;
    campusZone: string;
  };
  status: ResourceStatus;
  estimatedAvailableDate?: string;
  requiresVerification: boolean;
  trainingRequirement?: string;
  eligibility: string;
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
}
