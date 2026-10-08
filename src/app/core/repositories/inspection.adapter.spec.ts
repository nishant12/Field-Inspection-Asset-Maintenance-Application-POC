import { describe, it, expect } from 'vitest';
import { InspectionAdapter, InspectionApiDto } from './inspection.adapter';
import { Inspection } from '../../shared/models/inspection.model';

describe('InspectionAdapter (Adapter Pattern)', () => {
  const sampleDto: InspectionApiDto = {
    uuid: 'test-uuid-1',
    asset_code: 'AST-PUMP-001',
    asset_title: 'Centrifugal Pump A',
    category: 'Pumps',
    facility_location: 'Sector 4',
    inspection_timestamp: '2026-10-01T10:00:00.000Z',
    overall_condition: 'POOR',
    damage_detected: true,
    damage_details: 'Vibration in shaft',
    severity_rating: 'HIGH',
    field_notes: 'Requires repair',
    attached_images: [
      {
        photo_id: 'p-1',
        image_base64: 'data:image/png;base64,mock',
        caption: 'Bearing wear',
        captured_at: '2026-10-01T10:05:00.000Z',
      },
    ],
    sign_data_url: 'data:image/png;base64,sig',
    geo_coordinates: { lat: 34.05, lng: -118.25 },
    workflow_state: 'PENDING_APPROVAL',
    auditor_id: 'emp-101',
    auditor_name: 'Alex Carter',
    reviewer_id: undefined,
    reviewer_name: undefined,
    reviewer_remarks: undefined,
    review_timestamp: undefined,
    audit_log: [
      {
        log_id: 'l-1',
        logged_at: '2026-10-01T10:10:00.000Z',
        user_id: 'emp-101',
        user_name: 'Alex Carter',
        user_role: 'EMPLOYEE',
        event_type: 'SUBMITTED',
        comment: 'Submitted for verification',
      },
    ],
    created_iso: '2026-10-01T10:00:00.000Z',
    updated_iso: '2026-10-01T10:10:00.000Z',
  };

  it('should transform API DTO to Domain model correctly', () => {
    const domain = InspectionAdapter.toDomainFromApi(sampleDto);

    expect(domain.id).toBe('test-uuid-1');
    expect(domain.assetId).toBe('AST-PUMP-001');
    expect(domain.assetName).toBe('Centrifugal Pump A');
    expect(domain.hasDamage).toBe(true);
    expect(domain.severity).toBe('HIGH');
    expect(domain.status).toBe('PENDING_APPROVAL');
    expect(domain.photos.length).toBe(1);
    expect(domain.photos[0].caption).toBe('Bearing wear');
    expect(domain.gpsLocation?.latitude).toBe(34.05);
  });

  it('should transform Domain model back to API DTO with full fidelity', () => {
    const domain = InspectionAdapter.toDomainFromApi(sampleDto);
    const dto = InspectionAdapter.toApiDtoFromDomain(domain);

    expect(dto.uuid).toBe('test-uuid-1');
    expect(dto.asset_code).toBe('AST-PUMP-001');
    expect(dto.damage_detected).toBe(true);
    expect(dto.severity_rating).toBe('HIGH');
    expect(dto.field_notes).toBe('Requires repair');
    expect(dto.attached_images.length).toBe(1);
  });

  it('should convert domain model to and from local offline entity', () => {
    const domain = InspectionAdapter.toDomainFromApi(sampleDto);
    domain.syncStatus = 'PENDING_SYNC';

    const localEntity = InspectionAdapter.toLocalEntity(domain);
    expect(localEntity.id).toBe('test-uuid-1');
    expect(localEntity.syncStatus).toBe('PENDING_SYNC');

    const restoredDomain = InspectionAdapter.toDomainFromLocalEntity(localEntity);
    expect(restoredDomain.id).toBe('test-uuid-1');
    expect(restoredDomain.assetId).toBe('AST-PUMP-001');
    expect(restoredDomain.syncStatus).toBe('PENDING_SYNC');
  });
});
