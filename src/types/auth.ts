export type UserRole =
  | 'Student'
  | 'Faculty Researcher'
  | 'Lab Custodian'
  | 'Admin';

export interface User {
  id: number;
  full_name: string;
  email: string;
  role: UserRole;
  department?: string | null;
  student_id?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at?: string | null;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  full_name: string;
  email: string;
  password: string;
  department?: string;
  student_id?: string;
}

export interface UserRoleUpdatePayload {
  role: UserRole;
}

export type VerificationStatus =
  | 'Not Submitted'
  | 'Pending Review'
  | 'Verified'
  | 'Rejected'
  | 'Expired';

export interface EligibilityRecord {
  id: number;
  user_id: number;
  user_name?: string | null;
  user_email?: string | null;
  user_department?: string | null;
  user_student_id?: string | null;
  requirement_type: string;
  status: VerificationStatus;
  resource_id?: string | null;
  evidence_details?: string | null;
  reviewed_by?: number | null;
  reviewer_name?: string | null;
  reviewed_at?: string | null;
  review_notes?: string | null;
  created_at: string;
  updated_at?: string | null;
}

export interface EligibilityRequestPayload {
  requirement_type: string;
  resource_id?: string;
  evidence_details?: string;
}

export interface EligibilityReviewPayload {
  status: 'Verified' | 'Rejected';
  review_notes?: string;
}

export interface TrainingRequirementOption {
  id: string;
  name: string;
  department: string;
  description: string;
  validity_period: string;
  prerequisites: string[];
}
