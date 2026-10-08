import { Inspection, InspectionAuditEntry, InspectionPhoto, InspectionStatus, SyncStatus } from '../../shared/models/inspection.model';

export interface InspectionApiDto {
  uuid: string;
  asset_code: string;
  asset_title: string;
  category: string;
  facility_location: string;
  inspection_timestamp: string;
  overall_condition: string;
  damage_detected: boolean;
  damage_details?: string;
  severity_rating?: string;
  field_notes: string;
  attached_images: Array<{
    photo_id: string;
    image_base64: string;
    caption?: string;
    captured_at: string;
  }>;
  sign_data_url?: string;
  geo_coordinates?: {
    lat: number;
    lng: number;
  };
  workflow_state: string;
  auditor_id: string;
  auditor_name: string;
  reviewer_id?: string;
  reviewer_name?: string;
  reviewer_remarks?: string;
  review_timestamp?: string;
  audit_log: Array<{
    log_id: string;
    logged_at: string;
    user_id: string;
    user_name: string;
    user_role: string;
    event_type: string;
    comment?: string;
  }>;
  created_iso: string;
  updated_iso: string;
}

export interface InspectionLocalEntity {
  id: string;
  data: string; // JSON stringified inspection
  syncStatus: SyncStatus;
  updatedAt: number;
}

/**
 * Adapter Pattern:
 * Decouples external API representations and local entity representations
 * from our clean internal TypeScript domain model.
 */
export class InspectionAdapter {
  static toDomainFromApi(dto: InspectionApiDto): Inspection {
    return {
      id: dto.uuid,
      assetId: dto.asset_code,
      assetName: dto.asset_title,
      assetCategory: dto.category,
      location: dto.facility_location,
      inspectionDate: dto.inspection_timestamp,
      conditionStatus: dto.overall_condition as any,
      hasDamage: !!dto.damage_detected,
      damageDescription: dto.damage_details,
      severity: dto.severity_rating as any,
      notes: dto.field_notes,
      photos: (dto.attached_images || []).map((img) => ({
        id: img.photo_id,
        dataUrl: img.image_base64,
        caption: img.caption,
        timestamp: img.captured_at,
      })),
      signatureUrl: dto.sign_data_url,
      gpsLocation: dto.geo_coordinates
        ? { latitude: dto.geo_coordinates.lat, longitude: dto.geo_coordinates.lng }
        : undefined,
      status: dto.workflow_state as InspectionStatus,
      syncStatus: 'SYNCED',
      inspectorId: dto.auditor_id,
      inspectorName: dto.auditor_name,
      supervisorId: dto.reviewer_id,
      supervisorName: dto.reviewer_name,
      reviewComments: dto.reviewer_remarks,
      reviewedAt: dto.review_timestamp,
      history: (dto.audit_log || []).map((entry) => ({
        id: entry.log_id,
        timestamp: entry.logged_at,
        actorId: entry.user_id,
        actorName: entry.user_name,
        actorRole: entry.user_role as any,
        action: entry.event_type as any,
        notes: entry.comment,
      })),
      createdAt: dto.created_iso,
      updatedAt: dto.updated_iso,
    };
  }

  static toApiDtoFromDomain(domain: Inspection): InspectionApiDto {
    return {
      uuid: domain.id,
      asset_code: domain.assetId,
      asset_title: domain.assetName,
      category: domain.assetCategory,
      facility_location: domain.location,
      inspection_timestamp: domain.inspectionDate,
      overall_condition: domain.conditionStatus,
      damage_detected: domain.hasDamage,
      damage_details: domain.damageDescription,
      severity_rating: domain.severity,
      field_notes: domain.notes,
      attached_images: (domain.photos || []).map((p) => ({
        photo_id: p.id,
        image_base64: p.dataUrl,
        caption: p.caption,
        captured_at: p.timestamp,
      })),
      sign_data_url: domain.signatureUrl,
      geo_coordinates: domain.gpsLocation
        ? { lat: domain.gpsLocation.latitude, lng: domain.gpsLocation.longitude }
        : undefined,
      workflow_state: domain.status,
      auditor_id: domain.inspectorId,
      auditor_name: domain.inspectorName,
      reviewer_id: domain.supervisorId,
      reviewer_name: domain.supervisorName,
      reviewer_remarks: domain.reviewComments,
      review_timestamp: domain.reviewedAt,
      audit_log: (domain.history || []).map((h) => ({
        log_id: h.id,
        logged_at: h.timestamp,
        user_id: h.actorId,
        user_name: h.actorName,
        user_role: h.actorRole,
        event_type: h.action,
        comment: h.notes,
      })),
      created_iso: domain.createdAt,
      updated_iso: domain.updatedAt,
    };
  }

  static toLocalEntity(domain: Inspection): InspectionLocalEntity {
    return {
      id: domain.id,
      data: JSON.stringify(domain),
      syncStatus: domain.syncStatus,
      updatedAt: new Date(domain.updatedAt || domain.createdAt).getTime(),
    };
  }

  static toDomainFromLocalEntity(entity: InspectionLocalEntity): Inspection {
    const domain: Inspection = JSON.parse(entity.data);
    domain.syncStatus = entity.syncStatus;
    return domain;
  }
}
