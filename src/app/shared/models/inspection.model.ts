export type InspectionStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
export type SyncStatus = 'DRAFT' | 'PENDING_SYNC' | 'SYNC_FAILED' | 'SYNCED';
export type ConditionStatus = 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL';
export type SeverityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface InspectionPhoto {
  id: string;
  dataUrl: string; // base64 or blob URL
  caption?: string;
  timestamp: string;
  sizeKb?: number;
}

export interface InspectionAuditEntry {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: 'EMPLOYEE' | 'SUPERVISOR' | 'SYSTEM';
  action: 'CREATED' | 'UPDATED' | 'SAVED_DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'SYNCED';
  notes?: string;
}

export interface Inspection {
  id: string;
  assetId: string;
  assetName: string;
  assetCategory: string;
  location: string;
  inspectionDate: string;
  conditionStatus: ConditionStatus;
  hasDamage: boolean;
  damageDescription?: string;
  severity?: SeverityLevel;
  notes: string;
  photos: InspectionPhoto[];
  signatureUrl?: string;
  gpsLocation?: {
    latitude: number;
    longitude: number;
  };

  // Workflow & Sync
  status: InspectionStatus;
  syncStatus: SyncStatus;
  syncError?: string;
  lastSyncedAt?: string;

  // Actors & Audit
  inspectorId: string;
  inspectorName: string;
  supervisorId?: string;
  supervisorName?: string;
  reviewComments?: string;
  reviewedAt?: string;
  history: InspectionAuditEntry[];

  createdAt: string;
  updatedAt: string;
}

export interface AssetReference {
  id: string;
  name: string;
  category: string;
  facility: string;
  lastInspected?: string;
}
