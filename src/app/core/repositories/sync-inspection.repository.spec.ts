import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { firstValueFrom, of } from 'rxjs';
import { SyncInspectionRepository } from './sync-inspection.repository';
import { LocalInspectionRepository } from './local-inspection.repository';
import { RemoteInspectionRepository } from './remote-inspection.repository';
import { NetworkService } from '../services/network.service';
import { SyncQueueService } from '../sync/sync-queue.service';
import { ToastService } from '../services/toast.service';
import { Inspection } from '../../shared/models/inspection.model';

describe('SyncInspectionRepository (Offline-First Repository Pattern)', () => {
  let repo: SyncInspectionRepository;
  let mockLocalRepo: any;
  let mockRemoteRepo: any;
  let mockNetwork: any;
  let mockSyncQueue: any;
  let mockToast: any;

  const testInspection: Inspection = {
    id: 'test-insp-100',
    assetId: 'AST-PUMP-001',
    assetName: 'Centrifugal Pump A',
    assetCategory: 'Pumps',
    location: 'Sector 4',
    inspectionDate: '2026-10-01T10:00:00.000Z',
    conditionStatus: 'POOR',
    hasDamage: true,
    damageDescription: 'Seal leak',
    severity: 'HIGH',
    notes: 'Check immediately',
    photos: [],
    status: 'DRAFT',
    syncStatus: 'DRAFT',
    inspectorId: 'emp-101',
    inspectorName: 'Alex Carter',
    history: [],
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
  };

  beforeEach(() => {
    mockLocalRepo = {
      getAll: vi.fn(() => of([testInspection])),
      getById: vi.fn((id: string) => of({ ...testInspection, id })),
      save: vi.fn((insp: Inspection) => of(insp)),
      bulkUpsert: vi.fn((list: Inspection[]) => of(list)),
      delete: vi.fn(() => of(true)),
    };
    mockRemoteRepo = {
      fetchAll: vi.fn(() => of([])),
      fetchById: vi.fn((id: string) => of(null)),
      postInspection: vi.fn((insp: Inspection) => of({ ...insp, syncStatus: 'SYNCED' })),
      deleteInspection: vi.fn(() => of(true)),
    };
    mockNetwork = {
      isOnline: vi.fn(() => true),
    };
    mockSyncQueue = {
      enqueue: vi.fn(),
    };
    mockToast = {
      showSuccess: vi.fn(),
      showInfo: vi.fn(),
      showWarning: vi.fn(),
      showError: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        SyncInspectionRepository,
        { provide: LocalInspectionRepository, useValue: mockLocalRepo },
        { provide: RemoteInspectionRepository, useValue: mockRemoteRepo },
        { provide: NetworkService, useValue: mockNetwork },
        { provide: SyncQueueService, useValue: mockSyncQueue },
        { provide: ToastService, useValue: mockToast },
      ],
    });

    repo = TestBed.inject(SyncInspectionRepository);
  });

  it('should save inspection draft locally with DRAFT syncStatus', async () => {
    const saved = await firstValueFrom(repo.saveDraft(testInspection));
    expect(saved.status).toBe('DRAFT');
    expect(saved.syncStatus).toBe('DRAFT');
    expect(mockLocalRepo.save).toHaveBeenCalled();
  });

  it('should queue inspection when submitting offline', async () => {
    mockNetwork.isOnline.mockReturnValue(false);

    const submitted = await firstValueFrom(repo.submit(testInspection));
    expect(submitted.status).toBe('PENDING_APPROVAL');
    expect(submitted.syncStatus).toBe('PENDING_SYNC');
    expect(mockSyncQueue.enqueue).toHaveBeenCalledWith('SUBMIT', expect.any(Object));
  });

  it('should approve inspection and log audit entry', async () => {
    const approved = await firstValueFrom(
      repo.approve('test-insp-100', 'sup-201', 'Sarah Jenkins', 'Looks good')
    );
    expect(approved.status).toBe('APPROVED');
    expect(approved.supervisorName).toBe('Sarah Jenkins');
    expect(approved.reviewComments).toBe('Looks good');
    expect(approved.history.some((h) => h.action === 'APPROVED')).toBe(true);
  });

  it('should reject inspection and update review comments', async () => {
    const rejected = await firstValueFrom(
      repo.reject('test-insp-100', 'sup-201', 'Sarah Jenkins', 'Requires additional photo')
    );
    expect(rejected.status).toBe('REJECTED');
    expect(rejected.reviewComments).toBe('Requires additional photo');
    expect(rejected.history.some((h) => h.action === 'REJECTED')).toBe(true);
  });
});
