import { apiClient } from '../lib/axios';

export const searchService = {
  async globalSearch(q: string) {
    const response = await apiClient.get('/search/global', { params: { q } });
    return response.data;
  }
};
