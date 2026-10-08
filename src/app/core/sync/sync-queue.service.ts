import { Injectable, inject, signal } from '@angular/core';
import { SyncOperationType, SyncQueueItem, SyncSummary } from './sync.model';
import { Inspection } from '../../shared/models/inspection.model';
import { NetworkService } from '../services/network.service';
import { RemoteInspectionRepository } from '../repositories/remote-inspection.repository';
import { LocalInspectionRepository } from '../repositories/local-inspection.repository';
import { ToastService } from '../services/toast.service';
import { firstValueFrom } from 'rxjs';

const QUEUE_STORAGE_KEY = 'fia_sync_queue';
const MAX_RETRY_COUNT = 3;

@Injectable({
  providedIn: 'root',
})
export class SyncQueueService {
  private networkService = inject(NetworkService);
  private remoteRepo = inject(RemoteInspectionRepository);
  private localRepo = inject(LocalInspectionRepository);
  private toast = inject(ToastService);

  private queueSignal = signal<SyncQueueItem[]>(this.loadPersistedQueue());
  private isSyncingSignal = signal<boolean>(false);
  private lastSyncedSignal = signal<string | undefined>(undefined);

  public readonly queue = this.queueSignal.asReadonly();
  public readonly isSyncing = this.isSyncingSignal.asReadonly();
  public readonly lastSyncedAt = this.lastSyncedSignal.asReadonly();

  public readonly pendingCount = signal<number>(this.calculatePendingCount());
  public readonly failedCount = signal<number>(this.calculateFailedCount());

  constructor() {
    // Automatically trigger queue sync when internet connectivity returns
    this.networkService.onStatusChange.subscribe((isOnline) => {
      if (isOnline && this.pendingCount() > 0) {
        this.processQueue();
      }
    });
  }

  private calculatePendingCount(): number {
    return this.queueSignal().filter((q) => q.status === 'PENDING' || q.status === 'SYNCING').length;
  }

  private calculateFailedCount(): number {
    return this.queueSignal().filter((q) => q.status === 'FAILED').length;
  }

  private updateCounters(): void {
    this.pendingCount.set(this.calculatePendingCount());
    this.failedCount.set(this.calculateFailedCount());
  }

  private loadPersistedQueue(): SyncQueueItem[] {
    try {
      const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private persistQueue(items: SyncQueueItem[]): void {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(items));
    this.queueSignal.set(items);
    this.updateCounters();
  }

  public enqueue(operation: SyncOperationType, inspection: Inspection): void {
    const queue = [...this.queueSignal()];

    // If an item for this inspection already exists in queue, update it
    const existingIndex = queue.findIndex((q) => q.inspectionId === inspection.id);
    const item: SyncQueueItem = {
      id: existingIndex >= 0 ? queue[existingIndex].id : 'queue_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      inspectionId: inspection.id,
      operation,
      payload: inspection,
      enqueuedAt: new Date().toISOString(),
      retryCount: 0,
      status: 'PENDING',
    };

    if (existingIndex >= 0) {
      queue[existingIndex] = item;
    } else {
      queue.push(item);
    }

    this.persistQueue(queue);

    // If online, immediately attempt to process
    if (this.networkService.isOnline()) {
      this.processQueue();
    }
  }

  public async processQueue(): Promise<{ synced: number; failed: number }> {
    if (this.isSyncingSignal()) {
      return { synced: 0, failed: 0 };
    }

    if (!this.networkService.isOnline()) {
      return { synced: 0, failed: 0 };
    }

    this.isSyncingSignal.set(true);
    let queue = [...this.queueSignal()];
    let synced = 0;
    let failed = 0;

    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      if (item.status === 'COMPLETED') continue;

      item.status = 'SYNCING';
      this.persistQueue([...queue]);

      try {
        if (item.operation === 'CREATE' || item.operation === 'UPDATE' || item.operation === 'SUBMIT' || item.operation === 'APPROVE' || item.operation === 'REJECT') {
          // Push to remote
          const syncedRecord = await firstValueFrom(this.remoteRepo.postInspection(item.payload));
          syncedRecord.syncStatus = 'SYNCED';
          syncedRecord.lastSyncedAt = new Date().toISOString();

          // Update local entity to SYNCED
          await firstValueFrom(this.localRepo.save(syncedRecord));

          item.status = 'COMPLETED';
          synced++;
        }
      } catch (err: any) {
        item.retryCount += 1;
        item.lastError = err?.message || 'Sync failed';
        if (item.retryCount >= MAX_RETRY_COUNT) {
          item.status = 'FAILED';
          // Update local entity to SYNC_FAILED
          item.payload.syncStatus = 'SYNC_FAILED';
          item.payload.syncError = item.lastError;
          await firstValueFrom(this.localRepo.save(item.payload));
        } else {
          item.status = 'PENDING';
        }
        failed++;
      }
    }

    // Remove completed items from queue
    queue = queue.filter((q) => q.status !== 'COMPLETED');
    this.persistQueue(queue);
    this.isSyncingSignal.set(false);
    this.lastSyncedSignal.set(new Date().toISOString());

    if (synced > 0) {
      this.toast.showSuccess(`Synchronized ${synced} inspection${synced > 1 ? 's' : ''} successfully!`);
    }
    if (failed > 0) {
      this.toast.showError(`${failed} item${failed > 1 ? 's' : ''} failed to sync. Will retry.`);
    }

    return { synced, failed };
  }

  public retryItem(queueId: string): void {
    const queue = [...this.queueSignal()];
    const item = queue.find((q) => q.id === queueId);
    if (item) {
      item.retryCount = 0;
      item.status = 'PENDING';
      this.persistQueue(queue);
      this.processQueue();
    }
  }

  public clearQueue(): void {
    this.persistQueue([]);
  }
}
