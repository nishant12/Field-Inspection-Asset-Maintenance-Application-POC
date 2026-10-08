import { Inspection } from '../../shared/models/inspection.model';

export type SyncOperationType = 'CREATE' | 'UPDATE' | 'SUBMIT' | 'APPROVE' | 'REJECT';
export type QueueItemStatus = 'PENDING' | 'SYNCING' | 'FAILED' | 'COMPLETED';

export interface SyncQueueItem {
  id: string;
  inspectionId: string;
  operation: SyncOperationType;
  payload: Inspection;
  enqueuedAt: string;
  retryCount: number;
  status: QueueItemStatus;
  lastError?: string;
}

export interface SyncSummary {
  totalPending: number;
  totalFailed: number;
  lastSyncTimestamp?: string;
  isSyncing: boolean;
}
