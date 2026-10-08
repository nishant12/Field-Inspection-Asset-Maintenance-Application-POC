import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { roleGuard } from './core/auth/role.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.page').then((m) => m.DashboardPage),
    canActivate: [authGuard],
  },
  {
    path: 'inspections',
    loadComponent: () =>
      import('./features/inspections/inspection-list/inspection-list.page').then(
        (m) => m.InspectionListPage
      ),
    canActivate: [authGuard],
  },
  {
    path: 'inspections/new',
    loadComponent: () =>
      import('./features/inspections/inspection-form/inspection-form.page').then(
        (m) => m.InspectionFormPage
      ),
    canActivate: [authGuard],
  },
  {
    path: 'inspections/:id',
    loadComponent: () =>
      import('./features/inspections/inspection-details/inspection-details.page').then(
        (m) => m.InspectionDetailsPage
      ),
    canActivate: [authGuard],
  },
  {
    path: 'inspections/:id/edit',
    loadComponent: () =>
      import('./features/inspections/inspection-form/inspection-form.page').then(
        (m) => m.InspectionFormPage
      ),
    canActivate: [authGuard],
  },
  {
    path: 'approvals',
    loadComponent: () =>
      import('./features/approvals/approval-list/approval-list.page').then(
        (m) => m.ApprovalListPage
      ),
    canActivate: [authGuard, roleGuard],
    data: { role: 'SUPERVISOR' },
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
