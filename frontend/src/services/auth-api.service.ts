import { apiRequest } from '../lib/api';

export interface CurrentApiUserResponse {
  success: true;
  data: {
    user: {
      id: string;
      email: string | null;
    };
    profile: {
      id: string;
      fullName: string | null;
      role: 'user' | 'admin';
    };
  };
}

export interface AdminPingResponse {
  success: true;
  message: string;
}

export const getCurrentApiUser = () => apiRequest<CurrentApiUserResponse>('/api/auth/me');

export const verifyAdminApiAccess = () => apiRequest<AdminPingResponse>('/api/admin/ping');
