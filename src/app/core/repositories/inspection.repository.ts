import { Observable } from 'rxjs';
import { Inspection } from '../../shared/models/inspection.model';

export interface InspectionRepository {
  getAll(): Observable<Inspection[]>;
  getById(id: string): Observable<Inspection | null>;
  saveDraft(inspection: Inspection): Observable<Inspection>;
  submit(inspection: Inspection): Observable<Inspection>;
  approve(id: string, supervisorId: string, supervisorName: string, comments?: string): Observable<Inspection>;
  reject(id: string, supervisorId: string, supervisorName: string, comments: string): Observable<Inspection>;
  delete(id: string): Observable<boolean>;
}
