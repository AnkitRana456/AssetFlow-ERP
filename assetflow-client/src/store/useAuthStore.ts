import { create } from 'zustand';

export interface IUser {
  userId: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'ADMIN' | 'ASSET_MANAGER' | 'DEPARTMENT_HEAD' | 'EMPLOYEE';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  department?: {
    _id: string;
    name: string;
    code: string;
  };
}

interface AuthState {
  user: IUser | null;
  accessToken: string | null;
  loading: boolean;
  error: string | null;
  setUser: (user: IUser | null) => void;
  setAccessToken: (token: string | null) => void;
  logoutUser: () => void;
}

// Development Mock User to bypass login and test dashboards immediately
const MOCK_ADMIN_USER: IUser = {
  userId: '60c72b2f9b1d8b2bad7e4d89', // Seedeable Admin ObjectId format
  employeeId: 'EMP-0001',
  firstName: 'System',
  lastName: 'Administrator',
  email: 'admin@assetflow.com',
  role: 'ADMIN',
  status: 'ACTIVE'
};

export const useAuthStore = create<AuthState>((set) => ({
  // Seed with mock admin user for layout / route evaluation
  user: MOCK_ADMIN_USER,
  accessToken: 'mock-access-token-12345',
  loading: false,
  error: null,
  setUser: (user) => set({ user }),
  setAccessToken: (accessToken) => set({ accessToken }),
  logoutUser: () => set({ user: null, accessToken: null, error: null })
}));
