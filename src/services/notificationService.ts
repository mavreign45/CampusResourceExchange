import { apiClient } from './api';
import {
  AppNotification,
  NotificationListResponse,
  UnreadCountResponse,
} from '../types/notification';

export const notificationService = {
  /**
   * Fetch paginated notifications for the current authenticated user.
   */
  async getNotifications(params?: {
    page?: number;
    page_size?: number;
    is_read?: boolean;
  }): Promise<NotificationListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.page_size) searchParams.append('page_size', String(params.page_size));
    if (params?.is_read !== undefined) searchParams.append('is_read', String(params.is_read));

    const query = searchParams.toString();
    const endpoint = query ? `/notifications?${query}` : '/notifications';
    return apiClient<NotificationListResponse>(endpoint);
  },

  /**
   * Get unread notification count.
   */
  async getUnreadCount(): Promise<number> {
    const res = await apiClient<UnreadCountResponse>('/notifications/unread-count');
    return res.unread_count;
  },

  /**
   * Mark a single notification as read.
   */
  async markAsRead(id: number): Promise<AppNotification> {
    return apiClient<AppNotification>(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  },

  /**
   * Mark all unread notifications as read.
   */
  async markAllAsRead(): Promise<{ message: string; updated_count: number }> {
    return apiClient<{ message: string; updated_count: number }>('/notifications/read-all', {
      method: 'POST',
    });
  },

  /**
   * Run background reservation reminders, overdue processing, and expiry automation.
   */
  async runAutomation(): Promise<{
    timestamp: string;
    pickup_reminders_sent: number;
    return_reminders_sent: number;
    overdue_marked: number;
    expired_uncollected_cancelled: number;
  }> {
    return apiClient('/notifications/automation/run', {
      method: 'POST',
    });
  },
};
