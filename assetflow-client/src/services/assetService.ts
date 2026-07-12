import { apiClient } from '../lib/axios';

/**
 * Service for Asset Registration & Management API
 */
export const assetService = {
  async getAssets(params?: {
    search?: string;
    status?: string;
    department?: string;
    category?: string;
    condition?: string;
    location?: string;
    shared?: string;
    isBookable?: string;
    warranty?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    order?: string;
  }) {
    const response = await apiClient.get('/assets', { params });
    return response.data;
  },

  async getAssetById(id: string) {
    const response = await apiClient.get(`/assets/${id}`);
    return response.data;
  },

  // Note: FormData is required for uploads (photo/documents)
  async createAsset(formData: FormData) {
    const response = await apiClient.post('/assets', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  async updateAsset(id: string, formData: FormData) {
    const response = await apiClient.patch(`/assets/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  async deleteAsset(id: string) {
    const response = await apiClient.delete(`/assets/${id}`);
    return response.data;
  },

  async importAssets(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post('/assets/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  async exportAssets() {
    const response = await apiClient.get('/assets/export', {
      responseType: 'blob' // Required to parse download file stream
    });
    return response.data;
  },

  async getAssetHistory(id: string) {
    const response = await apiClient.get(`/assets/history/${id}`);
    return response.data;
  },
};
