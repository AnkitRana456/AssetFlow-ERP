import { apiClient } from '../lib/axios';

export const logService = {
  async getActivityLogs(params?: {
    search?: string;
    module?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const response = await apiClient.get('/activity-logs', { params });
    return response.data;
  },

  async downloadLogsCSV(params?: {
    search?: string;
    module?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const response = await apiClient.get('/activity-logs', {
      params: { ...params, format: 'csv' },
      responseType: 'blob'
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Audit_Trail_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
};
