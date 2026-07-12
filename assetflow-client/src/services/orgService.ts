import { apiClient } from '../lib/axios';

/**
 * Service for Organization Setup Master-Data API (Admin Only)
 */
export const orgService = {
  // --- Departments ---
  async getDepartments(params?: { search?: string; status?: string; page?: number; limit?: number }) {
    const response = await apiClient.get('/departments', { params });
    return response.data;
  },

  async getDepartmentById(id: string) {
    const response = await apiClient.get(`/departments/${id}`);
    return response.data;
  },

  async createDepartment(data: {
    name: string;
    code: string;
    description?: string;
    parentDepartment?: string | null;
    departmentHead?: string | null;
    location?: string;
    status?: string;
  }) {
    const response = await apiClient.post('/departments', data);
    return response.data;
  },

  async updateDepartment(id: string, data: {
    name?: string;
    code?: string;
    description?: string;
    parentDepartment?: string | null;
    departmentHead?: string | null;
    location?: string;
    status?: string;
  }) {
    const response = await apiClient.patch(`/departments/${id}`, data);
    return response.data;
  },

  async deleteDepartment(id: string) {
    const response = await apiClient.delete(`/departments/${id}`);
    return response.data;
  },

  // --- Asset Categories ---
  async getCategories(params?: { search?: string; status?: string; page?: number; limit?: number }) {
    const response = await apiClient.get('/categories', { params });
    return response.data;
  },

  async getCategoryById(id: string) {
    const response = await apiClient.get(`/categories/${id}`);
    return response.data;
  },

  async createCategory(data: {
    name: string;
    description?: string;
    icon?: string;
    maintenanceInterval: number;
    status?: string;
    customFields?: Array<{ name: string; type: string; required: boolean }>;
  }) {
    const response = await apiClient.post('/categories', data);
    return response.data;
  },

  async updateCategory(id: string, data: {
    name?: string;
    description?: string;
    icon?: string;
    maintenanceInterval?: number;
    status?: string;
    customFields?: Array<{ name: string; type: string; required: boolean }>;
  }) {
    const response = await apiClient.patch(`/categories/${id}`, data);
    return response.data;
  },

  async deleteCategory(id: string) {
    const response = await apiClient.delete(`/categories/${id}`);
    return response.data;
  },

  // --- Employees ---
  async getEmployees(params?: { search?: string; department?: string; role?: string; status?: string; page?: number; limit?: number }) {
    const response = await apiClient.get('/employees', { params });
    return response.data;
  },

  async getEmployeeById(id: string) {
    const response = await apiClient.get(`/employees/${id}`);
    return response.data;
  },

  async updateEmployee(id: string, data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    department?: string | null;
  }) {
    const response = await apiClient.patch(`/employees/${id}`, data);
    return response.data;
  },

  async promoteEmployee(id: string, data: {
    role: string;
    department?: string | null;
    reason: string;
  }) {
    const response = await apiClient.patch(`/employees/promote/${id}`, data);
    return response.data;
  },

  async updateEmployeeStatus(id: string, status: string) {
    const response = await apiClient.patch(`/employees/status/${id}`, { status });
    return response.data;
  }
};
