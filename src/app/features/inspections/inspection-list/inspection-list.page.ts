import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonList,
  IonItem,
  IonIcon,
  IonBadge,
  IonRefresher,
  IonRefresherContent,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonFab,
  IonFabButton,
  IonBackButton,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  addOutline,
  cubeOutline,
  searchOutline,
  cameraOutline,
  alertOutline,
  cloudOfflineOutline,
  cloudDoneOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  timeOutline,
  filterOutline,
} from 'ionicons/icons';
import { SyncInspectionRepository } from '../../../core/repositories/sync-inspection.repository';
import { Inspection, InspectionStatus } from '../../../shared/models/inspection.model';
import { SyncBadgeComponent } from '../../../shared/components/sync-badge/sync-badge.component';
import { StatusColorPipe } from '../../../shared/pipes/status-color.pipe';

const PAGE_SIZE = 8;

@Component({
  selector: 'app-inspection-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    DatePipe,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonSearchbar,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonList,
    IonItem,
    IonIcon,
    IonBadge,
    IonRefresher,
    IonRefresherContent,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonFab,
    IonFabButton,
    IonBackButton,
    SyncBadgeComponent,
    StatusColorPipe,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/dashboard"></ion-back-button>
        </ion-buttons>
        <ion-title>Inspections</ion-title>
        <ion-buttons slot="end">
          <app-sync-badge></app-sync-badge>
        </ion-buttons>
      </ion-toolbar>

      <ion-toolbar color="primary">
        <ion-searchbar
          [ngModel]="searchQuery()"
          (ionInput)="onSearchChange($event)"
          placeholder="Search asset, ID, location..."
          debounce="200"
        ></ion-searchbar>
      </ion-toolbar>

      <ion-toolbar>
        <ion-segment
          [ngModel]="selectedFilter()"
          (ngModelChange)="onFilterChange($event)"
          [scrollable]="true"
        >
          <ion-segment-button value="ALL">
            <ion-label>All</ion-label>
          </ion-segment-button>
          <ion-segment-button value="PENDING_APPROVAL">
            <ion-label>Pending</ion-label>
          </ion-segment-button>
          <ion-segment-button value="DRAFT">
            <ion-label>Drafts</ion-label>
          </ion-segment-button>
          <ion-segment-button value="APPROVED">
            <ion-label>Approved</ion-label>
          </ion-segment-button>
          <ion-segment-button value="REJECTED">
            <ion-label>Rejected</ion-label>
          </ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content class="list-content">
      <ion-refresher slot="fixed" (ionRefresh)="handleRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <ion-list lines="inset" class="inspection-items-list">
        @for (item of pagedInspections(); track item.id) {
          <ion-item button [routerLink]="['/inspections', item.id]" class="insp-item">
            <div class="condition-indicator" [class]="'cond-' + item.conditionStatus.toLowerCase()" slot="start"></div>
            
            <ion-label class="item-label">
              <div class="top-row">
                <span class="asset-id">{{ item.assetId }}</span>
                <span class="date-tag">{{ item.inspectionDate | date:'mediumDate' }}</span>
              </div>
              <h2 class="asset-title">{{ item.assetName }}</h2>
              <p class="asset-sub">{{ item.location }} &bull; {{ item.assetCategory }}</p>

              @if (item.hasDamage) {
                <div class="damage-flag">
                  <ion-icon name="alert-outline"></ion-icon>
                  <span>Damage: {{ item.severity }} Severity</span>
                </div>
              }

              <div class="meta-tags">
                <ion-badge [color]="item.status | statusColor:'status'">
                  {{ item.status.replace('_', ' ') }}
                </ion-badge>
                
                @if (item.syncStatus !== 'SYNCED') {
                  <ion-badge [color]="item.syncStatus | statusColor:'sync'">
                    <ion-icon name="cloud-offline-outline"></ion-icon>
                    {{ item.syncStatus.replace('_', ' ') }}
                  </ion-badge>
                }

                @if (item.photos && item.photos.length > 0) {
                  <span class="photo-pill">
                    <ion-icon name="camera-outline"></ion-icon>
                    {{ item.photos.length }}
                  </span>
                }
              </div>
            </ion-label>
          </ion-item>
        }

        @if (filteredInspections().length === 0) {
          <div class="empty-state">
            <ion-icon name="filter-outline" class="empty-icon"></ion-icon>
            <h3>No Inspections Found</h3>
            <p>Try adjusting your search query or status filter.</p>
            <ion-button fill="outline" color="primary" [routerLink]="['/inspections/new']">
              Create New Inspection
            </ion-button>
          </div>
        }
      </ion-list>

      @if (hasMoreItems()) {
        <ion-infinite-scroll (ionInfinite)="loadMore($event)">
          <ion-infinite-scroll-content loadingSpinner="bubbles" loadingText="Loading more inspections..."></ion-infinite-scroll-content>
        </ion-infinite-scroll>
      }

      <ion-fab slot="fixed" vertical="bottom" horizontal="end">
        <ion-fab-button [routerLink]="['/inspections/new']" color="primary">
          <ion-icon name="add-outline"></ion-icon>
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  `,
  styles: [
    `
      .list-content {
        --background: #f7f9fc;
      }
      .inspection-items-list {
        background: transparent;
        padding-bottom: 72px;
      }
      .insp-item {
        --border-radius: 12px;
        margin: 8px 12px;
        --background: #fff;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
      }
      .condition-indicator {
        width: 6px;
        align-self: stretch;
        border-radius: 4px;
        margin: 8px 8px 8px 0;
      }
      .cond-good { background: #2dd36f; }
      .cond-fair { background: #3880ff; }
      .cond-poor { background: #ffc409; }
      .cond-critical { background: #eb445a; }

      .item-label {
        padding: 6px 0;
      }
      .top-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2px;
      }
      .asset-id {
        font-size: 0.75rem;
        font-weight: 700;
        color: #4a5568;
        letter-spacing: 0.3px;
      }
      .date-tag {
        font-size: 0.72rem;
        color: #a0aec0;
      }
      .asset-title {
        font-size: 1rem;
        font-weight: 600;
        color: #1a202c;
        margin: 2px 0 3px;
      }
      .asset-sub {
        font-size: 0.78rem;
        color: #718096;
        margin-bottom: 6px;
      }
      .damage-flag {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        background: #feebc8;
        color: #c05621;
        font-size: 0.72rem;
        font-weight: 600;
        padding: 2px 6px;
        border-radius: 4px;
        margin-bottom: 6px;
        ion-icon {
          font-size: 12px;
        }
      }
      .meta-tags {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-top: 4px;
      }
      .photo-pill {
        display: inline-flex;
        align-items: center;
        gap: 3px;
        font-size: 0.72rem;
        color: #718096;
        background: #edf2f7;
        padding: 2px 6px;
        border-radius: 10px;
      }
      .empty-state {
        text-align: center;
        padding: 48px 24px;
        color: #718096;
        .empty-icon {
          font-size: 48px;
          color: #cbd5e0;
          margin-bottom: 12px;
        }
        h3 {
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0 0 6px;
          color: #2d3748;
        }
        p {
          font-size: 0.85rem;
          margin: 0 0 16px;
        }
      }
    `,
  ],
})
export class InspectionListPage implements OnInit {
  private repo = inject(SyncInspectionRepository);
  private route = inject(ActivatedRoute);

  public searchQuery = signal('');
  public selectedFilter = signal('ALL');

  private allInspectionsSignal = signal<Inspection[]>([]);
  public displayedCount = signal<number>(PAGE_SIZE);

  public readonly filteredInspections = computed(() => {
    let list = this.allInspectionsSignal();
    const query = this.searchQuery().trim().toLowerCase();

    if (this.selectedFilter() !== 'ALL') {
      list = list.filter((i) => i.status === this.selectedFilter());
    }

    if (query) {
      list = list.filter(
        (i) =>
          i.assetId.toLowerCase().includes(query) ||
          i.assetName.toLowerCase().includes(query) ||
          i.location.toLowerCase().includes(query) ||
          i.notes.toLowerCase().includes(query) ||
          i.inspectorName.toLowerCase().includes(query)
      );
    }

    return list;
  });

  public readonly pagedInspections = computed(() => {
    return this.filteredInspections().slice(0, this.displayedCount());
  });

  public readonly hasMoreItems = computed(() => {
    return this.displayedCount() < this.filteredInspections().length;
  });

  constructor() {
    addIcons({
      addOutline,
      cubeOutline,
      searchOutline,
      cameraOutline,
      alertOutline,
      cloudOfflineOutline,
      cloudDoneOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      timeOutline,
      filterOutline,
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      if (params['filter']) {
        this.selectedFilter.set(params['filter']);
      }
    });
    this.loadData();
  }

  ionViewWillEnter(): void {
    this.loadData();
  }

  loadData(): void {
    this.repo.getAll().subscribe((items) => {
      this.allInspectionsSignal.set(items);
    });
  }

  handleRefresh(event: any): void {
    this.repo.getAll().subscribe({
      next: (items) => {
        this.allInspectionsSignal.set(items);
        event.target.complete();
      },
      error: () => event.target.complete(),
    });
  }

  onSearchChange(event: CustomEvent<{ value?: string | null }>): void {
    this.searchQuery.set(event.detail.value ?? '');
    this.displayedCount.set(PAGE_SIZE);
  }

  onFilterChange(filter: string): void {
    this.selectedFilter.set(filter);
    this.displayedCount.set(PAGE_SIZE);
  }

  loadMore(event: any): void {
    setTimeout(() => {
      this.displayedCount.update((c) => c + PAGE_SIZE);
      event.target.complete();
    }, 300);
  }
}
