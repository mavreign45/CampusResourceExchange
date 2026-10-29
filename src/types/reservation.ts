export type ReservationStatus =
  | 'Pending'
  | 'Approved'
  | 'Rejected'
  | 'Cancelled'
  | 'Ready for Pickup'
  | 'Collected'
  | 'Return Pending'
  | 'Completed'
  | 'Overdue';

export interface ResourceSummary {
  id: string;
  name: string;
  category?: {
    id: number;
    name: string;
  } | null;
}

export interface UserSummary {
  id: number;
  full_name: string;
  email: string;
  role: string;
}

export interface Reservation {
  id: number;
  resource_id: string;
  requester_id: number;
  reviewed_by?: number | null;
  start_at: string;
  end_at: string;
  status: ReservationStatus;
  purpose: string;
  review_notes?: string | null;
  submitted_at: string;
  reviewed_at?: string | null;
  approved_at?: string | null;
  collected_at?: string | null;
  returned_at?: string | null;
  created_at: string;
  updated_at: string;

  resource?: ResourceSummary | null;
  requester?: UserSummary | null;
}

export interface ReservationCreatePayload {
  resource_id: string;
  start_at: string;
  end_at: string;
  purpose: string;
}

export interface ReservationReviewPayload {
  status: 'Approved' | 'Rejected';
  review_notes?: string;
}
