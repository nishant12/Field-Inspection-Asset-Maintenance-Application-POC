import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Inspection } from '../../shared/models/inspection.model';
import { InspectionAdapter, InspectionLocalEntity } from './inspection.adapter';
import { INITIAL_INSPECTIONS } from '../services/mock-data';

const LOCAL_STORAGE_KEY = 'fia_local_inspections';

@Injectable({
  providedIn: 'root',
})
export class LocalInspectionRepository {
  constructor() {
    this.seedIfEmpty();
  }

  private seedIfEmpty(): void {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      const initialEntities: InspectionLocalEntity[] = INITIAL_INSPECTIONS.map((item) =>
        InspectionAdapter.toLocalEntity(item)
      );
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialEntities));
    }
  }

  private readEntities(): InspectionLocalEntity[] {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private writeEntities(entities: InspectionLocalEntity[]): void {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(entities));
  }

  getAll(): Observable<Inspection[]> {
    const entities = this.readEntities();
    const items = entities
      .map((e) => InspectionAdapter.toDomainFromLocalEntity(e))
      .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
    return of(items);
  }

  getById(id: string): Observable<Inspection | null> {
    const entities = this.readEntities();
    const found = entities.find((e) => e.id === id);
    if (!found) return of(null);
    return of(InspectionAdapter.toDomainFromLocalEntity(found));
  }

  save(inspection: Inspection): Observable<Inspection> {
    const entities = this.readEntities();
    const entity = InspectionAdapter.toLocalEntity(inspection);
    const index = entities.findIndex((e) => e.id === entity.id);

    if (index >= 0) {
      entities[index] = entity;
    } else {
      entities.unshift(entity);
    }

    this.writeEntities(entities);
    return of(inspection);
  }

  bulkUpsert(inspections: Inspection[]): Observable<Inspection[]> {
    const entities = this.readEntities();
    for (const insp of inspections) {
      const entity = InspectionAdapter.toLocalEntity(insp);
      const idx = entities.findIndex((e) => e.id === entity.id);
      if (idx >= 0) {
        entities[idx] = entity;
      } else {
        entities.unshift(entity);
      }
    }
    this.writeEntities(entities);
    return of(inspections);
  }

  delete(id: string): Observable<boolean> {
    const entities = this.readEntities();
    const filtered = entities.filter((e) => e.id !== id);
    this.writeEntities(filtered);
    return of(true);
  }
}
