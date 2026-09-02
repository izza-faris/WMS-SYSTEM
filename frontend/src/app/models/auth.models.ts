export type Role = 'PLATFORM_ADMIN' | 'CLIENT_ADMIN' | 'BRANCH_MANAGER' | 'WAREHOUSE_STAFF' | 'VIEWER';
export type ClientStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED';

export interface UserProfile {
  id: number;
  clientId: number | null;
  branchId: number | null;
  fullName: string;
  email: string;
  role: Role;
  phone?: string;
  companyName?: string;
  branchName?: string;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  userId: number;
  clientId: number | null;
  branchId: number | null;
  fullName: string;
  email: string;
  role: Role;
  companyName: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}
