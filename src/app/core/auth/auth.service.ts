import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthSession, User, UserRole } from './user.model';
import { MOCK_USERS } from '../services/mock-data';
import { ToastService } from '../services/toast.service';

const SESSION_STORAGE_KEY = 'fia_auth_session';
const DEFAULT_SESSION_DURATION_HOURS = 8;

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private router = inject(Router);
  private toast = inject(ToastService);

  private sessionSignal = signal<AuthSession | null>(this.loadPersistedSession());

  public readonly currentSession = this.sessionSignal.asReadonly();
  public readonly currentUser = computed<User | null>(() => this.sessionSignal()?.user ?? null);
  public readonly isAuthenticated = computed<boolean>(() => {
    const session = this.sessionSignal();
    if (!session) return false;
    return session.expiresAt > Date.now();
  });
  public readonly userRole = computed<UserRole | null>(() => this.currentUser()?.role ?? null);
  public readonly isSupervisor = computed<boolean>(() => this.userRole() === 'SUPERVISOR');
  public readonly isEmployee = computed<boolean>(() => this.userRole() === 'EMPLOYEE');

  constructor() {
    this.checkSessionValidity();
  }

  private loadPersistedSession(): AuthSession | null {
    try {
      const raw = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!raw) return null;
      const parsed: AuthSession = JSON.parse(raw);
      if (parsed.expiresAt <= Date.now()) {
        localStorage.removeItem(SESSION_STORAGE_KEY);
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  private persistSession(session: AuthSession | null): void {
    if (session) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
    this.sessionSignal.set(session);
  }

  public checkSessionValidity(): boolean {
    const session = this.sessionSignal();
    if (!session) return false;
    if (session.expiresAt <= Date.now()) {
      this.handleSessionExpired();
      return false;
    }
    return true;
  }

  private handleSessionExpired(): void {
    this.persistSession(null);
    this.toast.showWarning('Your session has expired. Please sign in again.');
    this.router.navigate(['/login']);
  }

  public login(email: string, rolePreference?: UserRole): boolean {
    const normalized = email.trim().toLowerCase();
    let found = MOCK_USERS.find((u) => u.email.toLowerCase() === normalized);

    if (!found && rolePreference) {
      found = MOCK_USERS.find((u) => u.role === rolePreference);
    }

    if (!found) {
      // Default to employee
      found = {
        id: 'user-' + Date.now(),
        name: email.split('@')[0] || 'Field Worker',
        email,
        role: rolePreference || 'EMPLOYEE',
        department: 'Operations',
      };
    }

    const expiresAt = Date.now() + DEFAULT_SESSION_DURATION_HOURS * 3600 * 1000;
    const session: AuthSession = {
      token: 'jwt_mock_' + Math.random().toString(36).substring(2),
      user: found,
      expiresAt,
    };

    this.persistSession(session);
    return true;
  }

  public quickSwitchRole(role: UserRole): void {
    const user = MOCK_USERS.find((u) => u.role === role) || MOCK_USERS[0];
    const session: AuthSession = {
      token: 'jwt_mock_' + Math.random().toString(36).substring(2),
      user,
      expiresAt: Date.now() + DEFAULT_SESSION_DURATION_HOURS * 3600 * 1000,
    };
    this.persistSession(session);
    this.toast.showInfo(`Switched role to ${user.name} (${user.role})`);
  }

  public logout(): void {
    this.persistSession(null);
    this.toast.showInfo('Signed out successfully.');
    this.router.navigate(['/login']);
  }
}
