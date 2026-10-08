import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonBackButton,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonLabel,
  IonBadge,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
  IonSegment,
  IonSegmentButton,
  AlertController,
  ModalController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  checkmarkCircleOutline,
  closeCircleOutline,
  eyeOutline,
  cubeOutline,
  alertCircleOutline,
  cameraOutline,
  personOutline,
  timeOutline,
  shieldCheckmarkOutline,
} from 'ionicons/icons';
import { AuthService } from '../../../core/auth/auth.service';
import { SyncInspectionRepository } from '../../../core/repositories/sync-inspection.repository';
import { ToastService } from '../../../core/services/toast.service';
import { Inspection } from '../../../shared/models/inspection.model';
import { SyncBadgeComponent } from '../../../shared/components/sync-badge/sync-badge.component';
import { StatusColorPipe } from '../../../shared/pipes/status-color.pipe';

@Component({
  selector: 'app-approval-list',
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
    IonBackButton,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonLabel,
    IonBadge,
    IonIcon,
    IonRefresher,
    IonRefresherContent,
    IonSegment,
    IonSegmentButton,
    SyncBadgeComponent,
    StatusColorPipe,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="secondary">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/dashboard"></ion-back-button>
        </ion-buttons>
        <ion-title>Supervisor Review Portal</ion-title>
        <ion-buttons slot="end">
          <app-sync-badge></app-sync-badge>
        </ion-buttons>
      </ion-toolbar>

      <ion-toolbar color="secondary">
        <ion-segment [(ngModel)]="activeTab" (ionChange)="onTabChange()">
          <ion-segment-button value="PENDING">
            <ion-label>Pending Review ({{ pendingCount() }})</ion-label>
          </ion-segment-button>
          <ion-segment-button value="RESOLVED">
            <ion-label>History / Resolved</ion-label>
          </ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding approval-content">
      <ion-refresher slot="fixed" (ionRefresh)="handleRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <div class="supervisor-status-bar">
        <div class="sup-info">
          <ion-icon name="shield-checkmark-outline"></ion-icon>
          <div>
            <strong>{{ auth.currentUser()?.name }}</strong>
            <p>Supervisor Review Session &bull; Operations & Safety</p>
          </div>
        </div>
      </div>

      <div class="cards-list">
        @for (item of displayedInspections(); track item.id) {
          <ion-card class="approval-card">
            <ion-card-header>
              <div class="card-top-bar">
                <span class="asset-code">{{ item.assetId }}</span>
                <ion-badge [color]="item.status | statusColor:'status'">
                  {{ item.status.replace('_', ' ') }}
                </ion-badge>
              </div>
              <ion-card-title class="card-asset-title">{{ item.assetName }}</ion-card-title>
              <ion-card-subtitle>{{ item.location }} &bull; {{ item.inspectionDate | date:'mediumDate' }}</ion-card-subtitle>
            </ion-card-header>

            <ion-card-content>
              <div class="condition-summary">
                <span>Condition: </span>
                <ion-badge [color]="item.conditionStatus | statusColor:'condition'">
                  {{ item.conditionStatus }}
                </ion-badge>
                @if (item.hasDamage) {
                  <ion-badge color="danger" class="dmg-pill">
                    Damage: {{ item.severity }}
                  </ion-badge>
                }
              </div>

              @if (item.hasDamage && item.damageDescription) {
                <div class="dmg-quote">
                  <ion-icon name="alert-circle-outline"></ion-icon>
                  <p>{{ item.damageDescription }}</p>
                </div>
              }

              <div class="notes-preview">
                <p><strong>Inspector:</strong> {{ item.inspectorName }}</p>
                <p class="notes-line"><strong>Notes:</strong> {{ item.notes }}</p>
              </div>

              @if (item.reviewComments) {
                <div class="review-remark-box">
                  <strong>Supervisor Notes:</strong>
                  <p>{{ item.reviewComments }}</p>
                </div>
              }

              <!-- Review Action Buttons -->
              <div class="review-actions">
                <ion-button fill="outline" size="small" [routerLink]="['/inspections', item.id]">
                  <ion-icon name="eyeOutline" slot="start"></ion-icon>
                  Full Details
                </ion-button>

                @if (item.status === 'PENDING_APPROVAL') {
                  <div class="decision-buttons">
                    <ion-button color="danger" fill="outline" size="small" (click)="rejectInspection(item)">
                      <ion-icon name="close-circle-outline" slot="start"></ion-icon>
                      Reject
                    </ion-button>
                    <ion-button color="success" size="small" (click)="approveInspection(item)">
                      <ion-icon name="checkmark-circle-outline" slot="start"></ion-icon>
                      Approve
                    </ion-button>
                  </div>
                }
              </div>
            </ion-card-content>
          </ion-card>
        }

        @if (displayedInspections().length === 0) {
          <div class="empty-state">
            <ion-icon name="shield-checkmark-outline"></ion-icon>
            <h3>No Inspections Pending Review</h3>
            <p>All submitted inspections have been evaluated.</p>
          </div>
        }
      </div>
    </ion-content>
  `,
  styles: [
    `
      .approval-content {
        --background: #f7f9fc;
      }
      .supervisor-status-bar {
        background: #fff;
        padding: 12px 16px;
        border-radius: 12px;
        margin-bottom: 16px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      }
      .sup-info {
        display: flex;
        align-items: center;
        gap: 12px;
        ion-icon {
          font-size: 28px;
          color: var(--ion-color-secondary);
        }
        strong {
          color: #1a202c;
          font-size: 0.95rem;
        }
        p {
          margin: 2px 0 0;
          font-size: 0.75rem;
          color: #718096;
        }
      }
      .cards-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding-bottom: 32px;
      }
      .approval-card {
        border-radius: 14px;
        margin: 0;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      }
      .card-top-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 4px;
      }
      .asset-code {
        font-size: 0.75rem;
        font-weight: 700;
        color: #4a5568;
      }
      .card-asset-title {
        font-size: 1.1rem;
        font-weight: 700;
        color: #1a202c;
      }
      .condition-summary {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
        font-size: 0.85rem;
      }
      .dmg-pill {
        margin-left: auto;
      }
      .dmg-quote {
        display: flex;
        align-items: flex-start;
        gap: 6px;
        background: #fff5f5;
        border: 1px solid #fed7d7;
        padding: 8px 10px;
        border-radius: 6px;
        margin-bottom: 8px;
        ion-icon {
          color: #e53e3e;
          font-size: 16px;
          margin-top: 2px;
          flex-shrink: 0;
        }
        p {
          margin: 0;
          font-size: 0.82rem;
          color: #c53030;
        }
      }
      .notes-preview {
        font-size: 0.82rem;
        color: #4a5568;
        p {
          margin: 2px 0;
        }
      }
      .notes-line {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .review-remark-box {
        background: #f0f4f8;
        padding: 8px 10px;
        border-radius: 6px;
        margin-top: 8px;
        font-size: 0.82rem;
        color: #2d3748;
        p { margin: 2px 0 0; }
      }
      .review-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 14px;
        border-top: 1px solid #edf2f7;
        padding-top: 10px;
      }
      .decision-buttons {
        display: flex;
        gap: 8px;
      }
      .empty-state {
        text-align: center;
        padding: 48px 24px;
        color: #a0aec0;
        ion-icon {
          font-size: 48px;
          margin-bottom: 12px;
        }
        h3 {
          color: #4a5568;
          font-size: 1.1rem;
          margin: 0 0 6px;
        }
        p {
          margin: 0;
          font-size: 0.85rem;
        }
      }
    `,
  ],
})
export class ApprovalListPage implements OnInit {
  public auth = inject(AuthService);
  private repo = inject(SyncInspectionRepository);
  private toast = inject(ToastService);
  private alertCtrl = inject(AlertController);

  public activeTab: string = 'PENDING';
  private allInspectionsSignal = signal<Inspection[]>([]);

  public readonly pendingCount = computed(() => {
    return this.allInspectionsSignal().filter((i) => i.status === 'PENDING_APPROVAL').length;
  });

  public readonly displayedInspections = computed(() => {
    const list = this.allInspectionsSignal();
    if (this.activeTab === 'PENDING') {
      return list.filter((i) => i.status === 'PENDING_APPROVAL');
    } else {
      return list.filter((i) => i.status === 'APPROVED' || i.status === 'REJECTED');
    }
  });

  constructor() {
    addIcons({
      checkmarkCircleOutline,
      closeCircleOutline,
      eyeOutline,
      cubeOutline,
      alertCircleOutline,
      cameraOutline,
      personOutline,
      timeOutline,
      shieldCheckmarkOutline,
    });
  }

  ngOnInit(): void {
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

  onTabChange(): void {
    // Computed signal updates automatically
  }

  async approveInspection(item: Inspection): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Approve Inspection',
      subHeader: `${item.assetId} — ${item.assetName}`,
      inputs: [
        {
          name: 'comments',
          type: 'text',
          placeholder: 'Optional approval notes...',
        },
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Confirm Approve',
          handler: (data) => {
            const user = this.auth.currentUser();
            if (user) {
              this.repo.approve(item.id, user.id, user.name, data.comments).subscribe(() => {
                this.loadData();
              });
            }
          },
        },
      ],
    });
    await alert.present();
  }

  async rejectInspection(item: Inspection): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Reject Inspection',
      subHeader: 'Reason / Review Comments required',
      inputs: [
        {
          name: 'comments',
          type: 'textarea',
          placeholder: 'Provide corrective feedback or required measurements...',
        },
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Reject & Notify',
          handler: (data) => {
            if (!data.comments || !data.comments.trim()) {
              this.toast.showError('Rejection comments are required.');
              return false;
            }
            const user = this.auth.currentUser();
            if (user) {
              this.repo.reject(item.id, user.id, user.name, data.comments.trim()).subscribe(() => {
                this.loadData();
              });
            }
            return true;
          },
        },
      ],
    });
    await alert.present();
  }
}
