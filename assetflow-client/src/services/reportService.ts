import { apiClient } from '../lib/axios';

export const reportService = {
  async getReportData(params: { type: string; format?: string }) {
    const response = await apiClient.get('/reports/generate', { params });
    return response.data;
  },

  async downloadReportCSV(type: string) {
    const response = await apiClient.get('/reports/generate', {
      params: { type, format: 'csv' },
      responseType: 'blob'
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Report_${type}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
};
