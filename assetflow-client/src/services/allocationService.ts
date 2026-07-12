import { apiClient } from '../lib/axios';

export const allocationService = {
  // Allocations
  async getAllocations(params?: {
    search?: string;
    status?: string;
    department?: string;
    category?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    order?: string;
  }) {
    const response = await apiClient.get('/allocations', { params });
    return response.data;
  },

  async getAllocationById(id: string) {
    const response = await apiClient.get(`/allocations/${id}`);
    return response.data;
  },

  async createAllocation(data: {
    asset: string;
    employee: string;
    department: string;
    expectedReturn?: string;
    purpose?: string;
    notes?: string;
    attachments?: Array<{ name: string; url: string }>;
  }) {
    const response = await apiClient.post('/allocations', data);
    return response.data;
  },

  async updateAllocation(id: string, data: {
    expectedReturn?: string;
    purpose?: string;
    notes?: string;
    status?: string;
  }) {
    const response = await apiClient.patch(`/allocations/${id}`, data);
    return response.data;
  },

  // Transfers
  async getTransfers() {
    const response = await apiClient.get('/transfers');
    return response.data;
  },

  async createTransfer(data: {
    asset: string;
    toEmployee: string;
    reason: string;
  }) {
    const response = await apiClient.post('/transfers', data);
    return response.data;
  },

  async approveTransfer(id: string, remarks?: string) {
    const response = await apiClient.patch(`/transfers/${id}/approve`, { remarks });
    return response.data;
  },

  async rejectTransfer(id: string, remarks: string) {
    const response = await apiClient.patch(`/transfers/${id}/reject`, { remarks });
    return response.data;
  },

  async completeTransfer(id: string) {
    const response = await apiClient.patch(`/transfers/${id}/complete`);
    return response.data;
  },

  // Returns
  async getReturns() {
    const response = await apiClient.get('/returns');
    return response.data;
  },

  async createReturn(data: {
    asset: string;
    returnNotes?: string;
    condition: string;
    photos?: Array<{ name: string; url: string }>;
  }) {
    const response = await apiClient.post('/returns', data);
    return response.data;
  },

  async approveReturn(id: string, remarks?: string) {
    const response = await apiClient.patch(`/returns/${id}/approve`, { remarks });
    return response.data;
  },

  async rejectReturn(id: string, remarks: string) {
    const response = await apiClient.patch(`/returns/${id}/reject`, { remarks });
    return response.data;
  },

  // History / Timeline
  async getAssetTimeline(assetId: string) {
    const response = await apiClient.get(`/history/${assetId}`);
    return response.data;
  }
};
