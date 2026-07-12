import { apiClient } from '../lib/axios';

export const aiService = {
  async chatWithGemini(message: string) {
    const response = await apiClient.post('/ai/chat', { message });
    return response.data;
  }
};
