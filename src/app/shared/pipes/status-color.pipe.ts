import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'statusColor',
  standalone: true,
})
export class StatusColorPipe implements PipeTransform {
  transform(value: string | undefined | null, type: 'status' | 'sync' | 'condition' | 'severity' = 'status'): string {
    if (!value) return 'medium';

    switch (type) {
      case 'status':
        switch (value) {
          case 'APPROVED': return 'success';
          case 'PENDING_APPROVAL': return 'warning';
          case 'REJECTED': return 'danger';
          case 'DRAFT': return 'medium';
          default: return 'primary';
        }
      case 'sync':
        switch (value) {
          case 'SYNCED': return 'success';
          case 'PENDING_SYNC': return 'warning';
          case 'SYNC_FAILED': return 'danger';
          case 'DRAFT': return 'medium';
          default: return 'medium';
        }
      case 'condition':
        switch (value) {
          case 'GOOD': return 'success';
          case 'FAIR': return 'primary';
          case 'POOR': return 'warning';
          case 'CRITICAL': return 'danger';
          default: return 'medium';
        }
      case 'severity':
        switch (value) {
          case 'LOW': return 'success';
          case 'MEDIUM': return 'warning';
          case 'HIGH': return 'danger';
          case 'CRITICAL': return 'danger';
          default: return 'medium';
        }
      default:
        return 'medium';
    }
  }
}
