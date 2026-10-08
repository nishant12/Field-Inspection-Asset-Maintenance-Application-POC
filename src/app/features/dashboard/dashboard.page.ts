import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
  IonIcon,
  IonBadge,
  IonList,
  IonItem,
  IonLabel,
  IonRefresher,
  IonRefresherContent,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  clipboardOutline,
  checkmarkCircleOutline,
  timeOutline,
  alertCircleOutline,
  addOutline,
  syncOutline,
  personCircleOutline,
  logOutOutline,
  chevronForwardOutline,
  warningOutline,
  shieldCheckmarkOutline,
  swapHorizontalOutline,
  cubeOutline,
  arrowForwardOutline,
} from 'ionicons/icons';
import { AuthService } from '../../core/auth/auth.service';
import { SyncInspectionRepository } from '../../core/repositories/sync-inspection.repository';
import { Inspection, InspectionAuditEntry } from '../../shared/models/inspection.model';
import { SyncBadgeComponent } from '../../shared/components/sync-badge/sync-badge.component';
import { StatusColorPipe } from '../../shared/pipes/status-color.pipe';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    DatePipe,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonGrid,
    IonRow,
    IonCol,
    IonIcon,
    IonBadge,
    IonList,
    IonItem,
    IonLabel,
    IonRefresher,
    IonRefresherContent,
    SyncBadgeComponent,
    StatusColorPipe,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Dashboard</ion-title>
        <ion-buttons slot="end">
          <app-sync-badge></app-sync-badge>
          <ion-button (click)="logout()" title="Sign Out">
            <ion-icon name="log-out-outline" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding dashboard-content">
      <ion-refresher (ionRefresh)="handleRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <!-- User Welcome & Role Bar -->
      <div class="welcome-banner">
        <div class="welcome-text">
          <p class="greeting">Welcome back,</p>
          <h2 class="user-name">{{ auth.currentUser()?.name }}</h2>
          <div class="role-badge-row">
            <ion-badge [color]="auth.isSupervisor() ? 'secondary' : 'primary'">
              {{ auth.userRole() }}
            </ion-badge>
            <span class="user-dept">{{ auth.currentUser()?.department }}</span>
          </div>
        </div>
        <ion-button
          fill="clear"
          size="small"
          color="medium"
          (click)="switchRole()"
          title="Switch Demo Role"
        >
          <ion-icon name="swap-horizontal-outline" slot="icon-only"></ion-icon>
        </ion-button>
      </div>

      <!-- Quick Metrics Grid -->
      <ion-grid class="metrics-grid">
        <ion-row>
          <!-- Total Inspections -->
          <ion-col size="6" size-md="3">
            <div class="metric-card card-total" [routerLink]="['/inspections']" [queryParams]="{ filter: 'ALL' }">
              <div class="metric-icon"><ion-icon name="clipboard-outline"></ion-icon></div>
              <div class="metric-value">{{ totalCount() }}</div>
              <div class="metric-label">Total Assigned</div>
            </div>
          </ion-col>

          <!-- Completed -->
          <ion-col size="6" size-md="3">
            <div class="metric-card card-approved" [routerLink]="['/inspections']" [queryParams]="{ filter: 'APPROVED' }">
              <div class="metric-icon"><ion-icon name="checkmark-circle-outline"></ion-icon></div>
              <div class="metric-value">{{ approvedCount() }}</div>
              <div class="metric-label">Completed</div>
            </div>
          </ion-col>

          <!-- Pending Inspections / Drafts -->
          <ion-col size="6" size-md="3">
            <div class="metric-card card-pending" [routerLink]="['/inspections']" [queryParams]="{ filter: 'DRAFT' }">
              <div class="metric-icon"><ion-icon name="time-outline"></ion-icon></div>
              <div class="metric-value">{{ pendingWorkerCount() }}</div>
              <div class="metric-label">Pending / Drafts</div>
            </div>
          </ion-col>

          <!-- Pending Approvals -->
          <ion-col size="6" size-md="3">
            <div
              class="metric-card card-approvals"
              [routerLink]="auth.isSupervisor() ? ['/approvals'] : ['/inspections']"
              [queryParams]="{ filter: 'PENDING_APPROVAL' }"
            >
              <div class="metric-icon"><ion-icon name="alert-circle-outline"></ion-icon></div>
              <div class="metric-value">{{ pendingApprovalCount() }}</div>
              <div class="metric-label">Pending Approval</div>
            </div>
          </ion-col>
        </ion-row>
      </ion-grid>

      <!-- Quick Actions -->
      <div class="quick-action-strip">
        <ion-button expand="block" color="primary" [routerLink]="['/inspections/new']" class="action-btn">
          <ion-icon name="add-outline" slot="start"></ion-icon>
          New Inspection
        </ion-button>

        @if (auth.isSupervisor()) {
          <ion-button expand="block" color="secondary" fill="outline" [routerLink]="['/approvals']" class="action-btn">
            <ion-icon name="shield-checkmark-outline" slot="start"></ion-icon>
            Review Approvals
            @if (pendingApprovalCount() > 0) {
              <ion-badge color="danger" class="btn-badge">{{ pendingApprovalCount() }}</ion-badge>
            }
          </ion-button>
        }
      </div>

      <!-- Recent Inspections Card -->
      <ion-card class="section-card">
        <ion-card-header class="section-card-header">
          <div class="header-split">
            <ion-card-title>Recent Inspections</ion-card-title>
            <ion-button fill="clear" size="small" [routerLink]="['/inspections']">
              View All <ion-icon name="arrow-forward-outline" slot="end"></ion-icon>
            </ion-button>
          </div>
        </ion-card-header>

        <ion-card-content class="ion-no-padding">
          <ion-list lines="inset">
            @for (item of recentInspections(); track item.id) {
              <ion-item button [routerLink]="['/inspections', item.id]">
                <ion-icon name="cube-outline" slot="start" color="primary"></ion-icon>
                <ion-label>
                  <h3>{{ item.assetName }}</h3>
                  <p>{{ item.assetId }} &bull; {{ item.location }}</p>
                  <p class="date-text">{{ item.inspectionDate | date:'mediumDate' }}</p>
                </ion-label>
                <div class="item-badges" slot="end">
                  <ion-badge [color]="item.status | statusColor:'status'">
                    {{ item.status }}
                  </ion-badge>
                  <ion-badge [color]="item.conditionStatus | statusColor:'condition'">
                    {{ item.conditionStatus }}
                  </ion-badge>
                </div>
              </ion-item>
            }
            @if (recentInspections().length === 0) {
              <div class="empty-state">
                <p>No recent inspections found.</p>
              </div>
            }
          </ion-list>
        </ion-card-content>
      </ion-card>

      <!-- Audit Activity Log -->
      <ion-card class="section-card">
        <ion-card-header>
          <ion-card-title>Recent Activity Log</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <div class="activity-timeline">
            @for (act of recentActivity(); track act.id) {
              <div class="activity-item">
                <div class="activity-dot"></div>
                <div class="activity-content">
                  <div class="act-header">
                    <span class="actor-name">{{ act.actorName }}</span>
                    <span class="act-time">{{ act.timestamp | date:'shortTime' }}</span>
                  </div>
                  <div class="act-action">
                    <ion-badge [color]="act.action === 'APPROVED' ? 'success' : act.action === 'REJECTED' ? 'danger' : 'primary'">
                      {{ act.action }}
                    </ion-badge>
                    <span class="act-notes">{{ act.notes || act.inspectionRef }}</span>
                  </div>
                </div>
              </div>
            }
            @if (recentActivity().length === 0) {
              <p class="empty-subtext">No activity recorded yet.</p>
            }
          </div>
        </ion-card-content>
      </ion-card>
    </ion-content>
  `,
  styles: [
    `
      .dashboard-content {
        --background: #f7f9fc;
      }
      .welcome-banner {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: #fff;
        padding: 16px;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        margin-bottom: 16px;
      }
      .greeting {
        margin: 0;
        font-size: 0.8rem;
        color: #718096;
        text-transform: uppercase;
        font-weight: 600;
        letter-spacing: 0.5px;
      }
      .user-name {
        margin: 2px 0 6px;
        font-size: 1.3rem;
        font-weight: 700;
        color: #1a202c;
      }
      .role-badge-row {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .user-dept {
        font-size: 0.8rem;
        color: #718096;
      }
      .metrics-grid {
        padding: 0;
        margin-bottom: 12px;
      }
      .metric-card {
        background: #fff;
        border-radius: 12px;
        padding: 14px 12px;
        text-align: center;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        cursor: pointer;
        transition: transform 0.15s ease;
        &:active {
          transform: scale(0.98);
        }
      }
      .card-total .metric-icon { color: #3880ff; }
      .card-approved .metric-icon { color: #2dd36f; }
      .card-pending .metric-icon { color: #ffc409; }
      .card-approvals .metric-icon { color: #eb445a; }
      .metric-icon ion-icon {
        font-size: 24px;
      }
      .metric-value {
        font-size: 1.5rem;
        font-weight: 700;
        color: #1a202c;
        margin: 4px 0 2px;
      }
      .metric-label {
        font-size: 0.75rem;
        color: #718096;
        font-weight: 500;
      }
      .quick-action-strip {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 16px;
      }
      .action-btn {
        margin: 0;
        --border-radius: 8px;
        font-weight: 600;
      }
      .btn-badge {
        margin-left: 8px;
      }
      .section-card {
        margin: 0 0 16px 0;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      }
      .section-card-header {
        padding-bottom: 4px;
      }
      .header-split {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .header-split ion-card-title {
        font-size: 1.1rem;
        font-weight: 700;
      }
      .date-text {
        font-size: 0.75rem;
        color: #a0aec0;
      }
      .item-badges {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 4px;
      }
      .activity-timeline {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .activity-item {
        display: flex;
        align-items: flex-start;
        gap: 12px;
      }
      .activity-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: #3880ff;
        margin-top: 5px;
        flex-shrink: 0;
      }
      .activity-content {
        flex: 1;
      }
      .act-header {
        display: flex;
        justify-content: space-between;
      }
      .actor-name {
        font-size: 0.85rem;
        font-weight: 600;
        color: #2d3748;
      }
      .act-time {
        font-size: 0.75rem;
        color: #a0aec0;
      }
      .act-action {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 3px;
      }
      .act-notes {
        font-size: 0.8rem;
        color: #4a5568;
      }
      .empty-state, .empty-subtext {
        text-align: center;
        padding: 16px;
        color: #a0aec0;
        font-size: 0.85rem;
      }
    `,
  ],
})
export class DashboardPage implements OnInit {
  public auth = inject(AuthService);
  private repo = inject(SyncInspectionRepository);
  private toast = inject(ToastService);

  private inspectionsSignal = signal<Inspection[]>([]);

  public readonly totalCount = computed(() => this.inspectionsSignal().length);
  public readonly approvedCount = computed(
    () => this.inspectionsSignal().filter((i) => i.status === 'APPROVED').length
  );
  public readonly pendingWorkerCount = computed(
    () => this.inspectionsSignal().filter((i) => i.status === 'DRAFT' || i.syncStatus === 'PENDING_SYNC').length
  );
  public readonly pendingApprovalCount = computed(
    () => this.inspectionsSignal().filter((i) => i.status === 'PENDING_APPROVAL').length
  );
  public readonly recentInspections = computed(() => this.inspectionsSignal().slice(0, 4));

  public readonly recentActivity = computed(() => {
    const allEntries: Array<InspectionAuditEntry & { inspectionRef: string }> = [];
    for (const insp of this.inspectionsSignal()) {
      for (const h of insp.history || []) {
        allEntries.push({ ...h, inspectionRef: `${insp.assetId} - ${insp.assetName}` });
      }
    }
    return allEntries
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);
  });

  constructor() {
    addIcons({
      clipboardOutline,
      checkmarkCircleOutline,
      timeOutline,
      alertCircleOutline,
      addOutline,
      syncOutline,
      personCircleOutline,
      logOutOutline,
      chevronForwardOutline,
      warningOutline,
      shieldCheckmarkOutline,
      swapHorizontalOutline,
      cubeOutline,
      arrowForwardOutline,
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  ionViewWillEnter(): void {
    this.loadData();
  }

  loadData(): void {
    this.repo.getAll().subscribe((list) => {
      this.inspectionsSignal.set(list);
    });
  }

  handleRefresh(event: any): void {
    this.repo.getAll().subscribe({
      next: (list) => {
        this.inspectionsSignal.set(list);
        event.target.complete();
      },
      error: () => event.target.complete(),
    });
  }

  switchRole(): void {
    const nextRole = this.auth.isSupervisor() ? 'EMPLOYEE' : 'SUPERVISOR';
    this.auth.quickSwitchRole(nextRole);
    this.loadData();
  }

  logout(): void {
    this.auth.logout();
  }
}
