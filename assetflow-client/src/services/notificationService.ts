import { apiClient } from '../lib/axios';

export const notificationService = {
  async getNotifications(params?: { status?: string; page?: number; limit?: number }) {
    const response = await apiClient.get('/notifications', { params });
    return response.data;
  },

  async markAsRead(ids?: string[]) {
    const response = await apiClient.post('/notifications/mark-read', { ids });
    return response.data;
  },

  async deleteNotification(id: string) {
    const response = await apiClient.delete(`/notifications/${id}`);
    return response.data;
  },

  async deleteAllNotifications() {
    const response = await apiClient.delete('/notifications');
    return response.data;
  }
};
