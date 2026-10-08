export type UserRole = 'EMPLOYEE' | 'SUPERVISOR';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  department?: string;
}

export interface AuthSession {
  token: string;
  user: User;
  expiresAt: number; // Unix timestamp
}
