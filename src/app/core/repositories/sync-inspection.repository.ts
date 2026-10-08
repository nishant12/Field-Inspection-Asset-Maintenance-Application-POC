import { Injectable, inject } from '@angular/core';
import { Observable, catchError, firstValueFrom, from, map, of, switchMap } from 'rxjs';
import { Inspection, InspectionAuditEntry } from '../../shared/models/inspection.model';
import { InspectionRepository } from './inspection.repository';
import { LocalInspectionRepository } from './local-inspection.repository';
import { RemoteInspectionRepository } from './remote-inspection.repository';
import { NetworkService } from '../services/network.service';
import { SyncQueueService } from '../sync/sync-queue.service';
import { ToastService } from '../services/toast.service';

@Injectable({
  providedIn: 'root',
})
export class SyncInspectionRepository implements InspectionRepository {
  private localRepo = inject(LocalInspectionRepository);
  private remoteRepo = inject(RemoteInspectionRepository);
  private networkService = inject(NetworkService);
  private syncQueue = inject(SyncQueueService);
  private toast = inject(ToastService);

  getAll(): Observable<Inspection[]> {
    // Offline-first: always return local cache immediately
    return this.localRepo.getAll().pipe(
      switchMap((localItems) => {
        // If device is online, attempt background reconciliation
        if (this.networkService.isOnline()) {
          this.remoteRepo.fetchAll().pipe(
            catchError(() => of([]))
          ).subscribe((remoteItems) => {
            if (remoteItems.length > 0) {
              // Merge remote items, preserving un-synced local drafts/pending-sync
              const merged = [...localItems];
              for (const remote of remoteItems) {
                const localIdx = merged.findIndex((l) => l.id === remote.id);
                if (localIdx >= 0) {
                  // Only replace if local item is not currently pending sync
                  if (merged[localIdx].syncStatus === 'SYNCED') {
                    merged[localIdx] = remote;
                  }
                } else {
                  merged.push(remote);
                }
              }
              this.localRepo.bulkUpsert(merged).subscribe();
            }
          });
        }
        return of(localItems);
      })
    );
  }

  getById(id: string): Observable<Inspection | null> {
    return this.localRepo.getById(id).pipe(
      switchMap((localItem) => {
        if (localItem) return of(localItem);
        if (this.networkService.isOnline()) {
          return this.remoteRepo.fetchById(id);
        }
        return of(null);
      })
    );
  }

  saveDraft(inspection: Inspection): Observable<Inspection> {
    const updated: Inspection = {
      ...inspection,
      status: 'DRAFT',
      syncStatus: 'DRAFT',
      updatedAt: new Date().toISOString(),
    };

    // Add audit entry for draft
    const auditEntry: InspectionAuditEntry = {
      id: 'audit_' + Date.now(),
      timestamp: new Date().toISOString(),
      actorId: inspection.inspectorId,
      actorName: inspection.inspectorName,
      actorRole: 'EMPLOYEE',
      action: 'SAVED_DRAFT',
      notes: 'Inspection draft saved locally',
    };

    updated.history = [auditEntry, ...(updated.history || [])];

    return this.localRepo.save(updated).pipe(
      map((saved) => {
        this.toast.showInfo('Draft saved to local storage.');
        return saved;
      })
    );
  }

  submit(inspection: Inspection): Observable<Inspection> {
    const isOnline = this.networkService.isOnline();
    const updated: Inspection = {
      ...inspection,
      status: 'PENDING_APPROVAL',
      syncStatus: isOnline ? 'SYNCED' : 'PENDING_SYNC',
      updatedAt: new Date().toISOString(),
    };

    const auditEntry: InspectionAuditEntry = {
      id: 'audit_' + Date.now(),
      timestamp: new Date().toISOString(),
      actorId: inspection.inspectorId,
      actorName: inspection.inspectorName,
      actorRole: 'EMPLOYEE',
      action: 'SUBMITTED',
      notes: isOnline
        ? 'Inspection submitted and synced with server.'
        : 'Inspection submitted offline (queued for synchronization).',
    };

    updated.history = [auditEntry, ...(updated.history || [])];

    if (isOnline) {
      // Direct remote submission
      return this.remoteRepo.postInspection(updated).pipe(
        switchMap((serverResult) => {
          serverResult.syncStatus = 'SYNCED';
          return this.localRepo.save(serverResult);
        }),
        catchError((err) => {
          console.warn('Online submission failed, falling back to offline queue:', err);
          updated.syncStatus = 'PENDING_SYNC';
          return this.localRepo.save(updated).pipe(
            map((local) => {
              this.syncQueue.enqueue('SUBMIT', local);
              this.toast.showWarning('Network glitch: Inspection queued for auto-sync.');
              return local;
            })
          );
        })
      );
    } else {
      // Offline submission
      return this.localRepo.save(updated).pipe(
        map((saved) => {
          this.syncQueue.enqueue('SUBMIT', saved);
          this.toast.showWarning('Working Offline: Inspection saved locally and queued for sync.');
          return saved;
        })
      );
    }
  }

  approve(id: string, supervisorId: string, supervisorName: string, comments?: string): Observable<Inspection> {
    return this.getById(id).pipe(
      switchMap((current) => {
        if (!current) throw new Error('Inspection not found');

        const isOnline = this.networkService.isOnline();
        const updated: Inspection = {
          ...current,
          status: 'APPROVED',
          supervisorId,
          supervisorName,
          reviewComments: comments,
          reviewedAt: new Date().toISOString(),
          syncStatus: isOnline ? 'SYNCED' : 'PENDING_SYNC',
          updatedAt: new Date().toISOString(),
        };

        const auditEntry: InspectionAuditEntry = {
          id: 'audit_' + Date.now(),
          timestamp: new Date().toISOString(),
          actorId: supervisorId,
          actorName: supervisorName,
          actorRole: 'SUPERVISOR',
          action: 'APPROVED',
          notes: comments || 'Approved by supervisor',
        };

        updated.history = [auditEntry, ...(updated.history || [])];

        if (isOnline) {
          return this.remoteRepo.postInspection(updated).pipe(
            switchMap((res) => this.localRepo.save(res)),
            map((saved) => {
              this.toast.showSuccess(`Inspection #${id} approved!`);
              return saved;
            })
          );
        } else {
          return this.localRepo.save(updated).pipe(
            map((saved) => {
              this.syncQueue.enqueue('APPROVE', saved);
              this.toast.showWarning('Approval recorded offline and queued for sync.');
              return saved;
            })
          );
        }
      })
    );
  }

  reject(id: string, supervisorId: string, supervisorName: string, comments: string): Observable<Inspection> {
    return this.getById(id).pipe(
      switchMap((current) => {
        if (!current) throw new Error('Inspection not found');

        const isOnline = this.networkService.isOnline();
        const updated: Inspection = {
          ...current,
          status: 'REJECTED',
          supervisorId,
          supervisorName,
          reviewComments: comments,
          reviewedAt: new Date().toISOString(),
          syncStatus: isOnline ? 'SYNCED' : 'PENDING_SYNC',
          updatedAt: new Date().toISOString(),
        };

        const auditEntry: InspectionAuditEntry = {
          id: 'audit_' + Date.now(),
          timestamp: new Date().toISOString(),
          actorId: supervisorId,
          actorName: supervisorName,
          actorRole: 'SUPERVISOR',
          action: 'REJECTED',
          notes: comments,
        };

        updated.history = [auditEntry, ...(updated.history || [])];

        if (isOnline) {
          return this.remoteRepo.postInspection(updated).pipe(
            switchMap((res) => this.localRepo.save(res)),
            map((saved) => {
              this.toast.showInfo(`Inspection #${id} rejected with comments.`);
              return saved;
            })
          );
        } else {
          return this.localRepo.save(updated).pipe(
            map((saved) => {
              this.syncQueue.enqueue('REJECT', saved);
              this.toast.showWarning('Rejection recorded offline and queued for sync.');
              return saved;
            })
          );
        }
      })
    );
  }

  delete(id: string): Observable<boolean> {
    return this.localRepo.delete(id).pipe(
      switchMap((res) => {
        if (this.networkService.isOnline()) {
          return this.remoteRepo.deleteInspection(id).pipe(catchError(() => of(true)));
        }
        return of(res);
      })
    );
  }
}
