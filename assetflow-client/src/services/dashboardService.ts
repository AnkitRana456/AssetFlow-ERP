import { apiClient } from '../lib/axios';

export const dashboardService = {
  async getExecutiveStats() {
    const response = await apiClient.get('/dashboard/executive');
    return response.data;
  }
};
