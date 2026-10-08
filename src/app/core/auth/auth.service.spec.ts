import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { ToastService } from '../services/toast.service';

describe('AuthService', () => {
  let service: AuthService;
  let mockRouter: any;
  let mockToast: any;

  beforeEach(() => {
    localStorage.clear();
    mockRouter = { navigate: vi.fn() };
    mockToast = { showSuccess: vi.fn(), showInfo: vi.fn(), showWarning: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: Router, useValue: mockRouter },
        { provide: ToastService, useValue: mockToast },
      ],
    });

    service = TestBed.inject(AuthService);
  });

  it('should authenticate user and set role on login', () => {
    service.login('alex@fieldservice.com');
    expect(service.isAuthenticated()).toBe(true);
    expect(service.currentUser()?.email).toBe('alex@fieldservice.com');
    expect(service.isEmployee()).toBe(true);
    expect(service.isSupervisor()).toBe(false);
  });

  it('should switch role to supervisor cleanly', () => {
    service.quickSwitchRole('SUPERVISOR');
    expect(service.isAuthenticated()).toBe(true);
    expect(service.isSupervisor()).toBe(true);
    expect(service.currentUser()?.role).toBe('SUPERVISOR');
  });

  it('should cleanup state and navigate to login on logout', () => {
    service.login('alex@fieldservice.com');
    expect(service.isAuthenticated()).toBe(true);

    service.logout();
    expect(service.isAuthenticated()).toBe(false);
    expect(service.currentUser()).toBeNull();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
  });
});
