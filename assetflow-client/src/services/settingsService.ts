import { apiClient } from '../lib/axios';

export const settingsService = {
  async getSettings() {
    const response = await apiClient.get('/settings');
    return response.data;
  },

  async updateSettings(data: any) {
    const response = await apiClient.put('/settings', data);
    return response.data;
  }
};
