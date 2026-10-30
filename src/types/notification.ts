export type NotificationType =
  | 'reservation_submitted'
  | 'reservation_approved'
  | 'reservation_rejected'
  | 'reservation_cancelled'
  | 'ready_for_pickup'
  | 'pickup_reminder'
  | 'return_reminder'
  | 'reservation_overdue'
  | 'reservation_expired'
  | 'reservation_completed'
  | 'eligibility_submitted'
  | 'eligibility_verified'
  | 'eligibility_rejected'
  | 'system_alert';

export interface AppNotification {
  id: number;
  recipient_id: number;
  notification_type: NotificationType;
  title: string;
  message: string;
  entity_type?: 'reservation' | 'eligibility' | string | null;
  entity_id?: string | null;
  is_read: boolean;
  created_at: string;
  read_at?: string | null;
}

export interface NotificationListResponse {
  items: AppNotification[];
  total: number;
  unread_count: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface UnreadCountResponse {
  unread_count: number;
}
