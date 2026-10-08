import { describe, it, expect } from 'vitest';
import { StatusColorPipe } from './status-color.pipe';

describe('StatusColorPipe', () => {
  const pipe = new StatusColorPipe();

  it('should return correct colors for inspection status', () => {
    expect(pipe.transform('APPROVED', 'status')).toBe('success');
    expect(pipe.transform('PENDING_APPROVAL', 'status')).toBe('warning');
    expect(pipe.transform('REJECTED', 'status')).toBe('danger');
    expect(pipe.transform('DRAFT', 'status')).toBe('medium');
  });

  it('should return correct colors for sync status', () => {
    expect(pipe.transform('SYNCED', 'sync')).toBe('success');
    expect(pipe.transform('PENDING_SYNC', 'sync')).toBe('warning');
    expect(pipe.transform('SYNC_FAILED', 'sync')).toBe('danger');
  });

  it('should return correct colors for condition and severity', () => {
    expect(pipe.transform('GOOD', 'condition')).toBe('success');
    expect(pipe.transform('CRITICAL', 'condition')).toBe('danger');
    expect(pipe.transform('HIGH', 'severity')).toBe('danger');
    expect(pipe.transform('LOW', 'severity')).toBe('success');
  });

  it('should fallback to medium for unknown or null values', () => {
    expect(pipe.transform(null, 'status')).toBe('medium');
    expect(pipe.transform(undefined, 'status')).toBe('medium');
  });
});
