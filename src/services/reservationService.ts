import { apiClient } from './api';
import {
  Reservation,
  ReservationCreatePayload,
  ReservationReviewPayload,
} from '../types/reservation';

export const reservationService = {
  /**
   * Submit a new reservation request for a resource.
   */
  async createReservation(payload: ReservationCreatePayload): Promise<Reservation> {
    return apiClient<Reservation>('/requests', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Fetch current authenticated user's own reservations.
   */
  async getMyReservations(): Promise<Reservation[]> {
    return apiClient<Reservation[]>('/requests/me');
  },

  /**
   * Get a single reservation by ID (requester or reviewer).
   */
  async getReservationById(id: number): Promise<Reservation> {
    return apiClient<Reservation>(`/requests/${id}`);
  },

  /**
   * Cancel a pending or approved reservation.
   */
  async cancelReservation(id: number): Promise<Reservation> {
    return apiClient<Reservation>(`/requests/${id}/cancel`, {
      method: 'POST',
    });
  },

  /**
   * Review queue for Lab Custodians and Admins.
   */
  async getReviewQueue(status?: string): Promise<Reservation[]> {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return apiClient<Reservation[]>(`/requests/review-queue${query}`);
  },

  /**
   * Approve or reject a pending reservation request with optional notes.
   */
  async reviewReservation(
    id: number,
    payload: ReservationReviewPayload
  ): Promise<Reservation> {
    return apiClient<Reservation>(`/requests/${id}/review`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Mark reservation as Ready for Pickup.
   */
  async markReadyForPickup(id: number): Promise<Reservation> {
    return apiClient<Reservation>(`/requests/${id}/ready`, {
      method: 'POST',
    });
  },

  /**
   * Record custody handover (equipment collected by requester).
   */
  async markCollected(id: number): Promise<Reservation> {
    return apiClient<Reservation>(`/requests/${id}/collect`, {
      method: 'POST',
    });
  },

  /**
   * Record return initiated (equipment returned to lab).
   */
  async markReturn(id: number): Promise<Reservation> {
    return apiClient<Reservation>(`/requests/${id}/return`, {
      method: 'POST',
    });
  },

  /**
   * Complete the reservation after return inspection.
   */
  async markCompleted(id: number): Promise<Reservation> {
    return apiClient<Reservation>(`/requests/${id}/complete`, {
      method: 'POST',
    });
  },
};
