import { apiClient } from '../lib/axios';

export interface AuditCyclePayload {
  title: string;
  description?: string;
  type: 'FULL_ORG' | 'DEPARTMENT' | 'LOCATION' | 'CATEGORY' | 'RANDOM_SAMPLING';
  department?: string;
  location?: string;
  categories?: string[];
  assets?: string[];
  auditors: string[];
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  startDate: string;
  endDate: string;
}

export interface VerificationPayload {
  scannedCode?: string;
  assetId?: string;
  verificationStatus: 'VERIFIED' | 'MISSING' | 'DAMAGED' | 'DISPOSED' | 'DUPLICATE';
  auditorNotes?: string;
}

export const auditService = {
  async getAudits(params?: {
    search?: string;
    status?: string;
    department?: string;
    auditor?: string;
    priority?: string;
    page?: number;
    limit?: number;
  }) {
    const response = await apiClient.get('/audits', { params });
    return response.data;
  },

  async getAuditById(id: string) {
    const response = await apiClient.get(`/audits/${id}`);
    return response.data;
  },

  async createAudit(data: AuditCyclePayload) {
    const response = await apiClient.post('/audits', data);
    return response.data;
  },

  async updateAudit(id: string, data: Partial<AuditCyclePayload>) {
    const response = await apiClient.patch(`/audits/${id}`, data);
    return response.data;
  },

  async deleteAudit(id: string) {
    const response = await apiClient.delete(`/audits/${id}`);
    return response.data;
  },

  async startAudit(id: string) {
    const response = await apiClient.post(`/audits/${id}/start`);
    return response.data;
  },

  async verifyAsset(id: string, data: VerificationPayload) {
    const response = await apiClient.post(`/audits/${id}/verify`, data);
    return response.data;
  },

  async bulkVerifyAssets(id: string, data: { itemIds: string[]; verificationStatus: string; auditorNotes?: string }) {
    const response = await apiClient.post(`/audits/${id}/bulk-verify`, data);
    return response.data;
  },

  async getAuditReport(id: string, format?: 'json' | 'csv') {
    if (format === 'csv') {
      const response = await apiClient.get(`/audits/${id}/report`, {
        params: { format: 'csv' },
        responseType: 'blob'
      });
      return response.data;
    }
    const response = await apiClient.get(`/audits/${id}/report`);
    return response.data;
  },

  async closeAudit(id: string, data: { resolutionNotes: string }) {
    const response = await apiClient.post(`/audits/${id}/close`, data);
    return response.data;
  },

  async getAuditDashboard() {
    const response = await apiClient.get('/audits/dashboard');
    return response.data;
  },

  async getAuditAnalytics() {
    const response = await apiClient.get('/audits/analytics');
    return response.data;
  }
};
