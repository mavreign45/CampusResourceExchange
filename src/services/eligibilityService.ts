import { apiClient } from './api';
import {
  EligibilityRecord,
  EligibilityRequestPayload,
  EligibilityReviewPayload,
  TrainingRequirementOption,
} from '../types/auth';

export const eligibilityService = {
  /**
   * Fetch current authenticated user's eligibility and training verifications.
   */
  async getMyEligibility(): Promise<EligibilityRecord[]> {
    return apiClient<EligibilityRecord[]>('/eligibility/me');
  },

  /**
   * List available campus standard training requirements and certifications.
   */
  async getTrainingRequirements(): Promise<TrainingRequirementOption[]> {
    return apiClient<TrainingRequirementOption[]>('/eligibility/requirements');
  },

  /**
   * Submit a new eligibility verification request.
   */
  async submitRequest(payload: EligibilityRequestPayload): Promise<EligibilityRecord> {
    return apiClient<EligibilityRecord>('/eligibility/requests', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Reviewer queue for Lab Custodians and Admins.
   */
  async listReviewRequests(params?: {
    status?: string;
    requirement_type?: string;
    user_id?: number;
  }): Promise<EligibilityRecord[]> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.requirement_type)
      searchParams.append('requirement_type', params.requirement_type);
    if (params?.user_id) searchParams.append('user_id', String(params.user_id));

    const queryString = searchParams.toString();
    const endpoint = queryString
      ? `/eligibility/requests?${queryString}`
      : '/eligibility/requests';

    return apiClient<EligibilityRecord[]>(endpoint);
  },

  /**
   * Review (approve or reject) a verification request.
   */
  async reviewRequest(
    requestId: number,
    payload: EligibilityReviewPayload
  ): Promise<EligibilityRecord> {
    return apiClient<EligibilityRecord>(
      `/eligibility/requests/${requestId}/review`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }
    );
  },
};
