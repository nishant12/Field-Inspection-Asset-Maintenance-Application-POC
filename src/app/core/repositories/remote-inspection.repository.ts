import { Injectable, inject } from '@angular/core';
import { Observable, delay, of, throwError } from 'rxjs';
import { Inspection } from '../../shared/models/inspection.model';
import { NetworkService } from '../services/network.service';
import { InspectionAdapter, InspectionApiDto } from './inspection.adapter';
import { INITIAL_INSPECTIONS } from '../services/mock-data';

const REMOTE_STORAGE_KEY = 'fia_remote_backend_db';

@Injectable({
  providedIn: 'root',
})
export class RemoteInspectionRepository {
  private networkService = inject(NetworkService);

  constructor() {
    this.seedServerIfEmpty();
  }

  private seedServerIfEmpty(): void {
    const raw = localStorage.getItem(REMOTE_STORAGE_KEY);
    if (!raw) {
      // Server holds already submitted/approved/rejected inspections
      const dtos: InspectionApiDto[] = INITIAL_INSPECTIONS
        .filter((i) => i.status !== 'DRAFT')
        .map((i) => InspectionAdapter.toApiDtoFromDomain(i));
      localStorage.setItem(REMOTE_STORAGE_KEY, JSON.stringify(dtos));
    }
  }

  private readDtos(): InspectionApiDto[] {
    try {
      const raw = localStorage.getItem(REMOTE_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private writeDtos(dtos: InspectionApiDto[]): void {
    localStorage.setItem(REMOTE_STORAGE_KEY, JSON.stringify(dtos));
  }

  private checkConnectivity(): void {
    if (!this.networkService.isOnline()) {
      throw new Error('Network Error: Device is offline or server is unreachable.');
    }
  }

  fetchAll(): Observable<Inspection[]> {
    try {
      this.checkConnectivity();
      const dtos = this.readDtos();
      const domainList = dtos.map((d) => InspectionAdapter.toDomainFromApi(d));
      return of(domainList).pipe(delay(250));
    } catch (err) {
      return throwError(() => err);
    }
  }

  fetchById(id: string): Observable<Inspection | null> {
    try {
      this.checkConnectivity();
      const dtos = this.readDtos();
      const found = dtos.find((d) => d.uuid === id);
      if (!found) return of(null).pipe(delay(150));
      return of(InspectionAdapter.toDomainFromApi(found)).pipe(delay(150));
    } catch (err) {
      return throwError(() => err);
    }
  }

  postInspection(inspection: Inspection): Observable<Inspection> {
    try {
      this.checkConnectivity();
      const dtos = this.readDtos();
      const dto = InspectionAdapter.toApiDtoFromDomain(inspection);
      const idx = dtos.findIndex((d) => d.uuid === dto.uuid);

      if (idx >= 0) {
        dtos[idx] = dto;
      } else {
        dtos.unshift(dto);
      }

      this.writeDtos(dtos);
      const savedDomain = InspectionAdapter.toDomainFromApi(dto);
      savedDomain.syncStatus = 'SYNCED';
      return of(savedDomain).pipe(delay(300));
    } catch (err) {
      return throwError(() => err);
    }
  }

  deleteInspection(id: string): Observable<boolean> {
    try {
      this.checkConnectivity();
      const dtos = this.readDtos();
      const filtered = dtos.filter((d) => d.uuid !== id);
      this.writeDtos(filtered);
      return of(true).pipe(delay(200));
    } catch (err) {
      return throwError(() => err);
    }
  }
}
