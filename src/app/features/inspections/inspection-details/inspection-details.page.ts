import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
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
  IonCardContent,
  IonIcon,
  IonBadge,
  IonGrid,
  IonRow,
  IonCol,
  IonFooter,
  AlertController,
  ModalController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  cubeOutline,
  calendarOutline,
  locationOutline,
  alertCircleOutline,
  cameraOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  createOutline,
  shieldCheckmarkOutline,
  timeOutline,
  personOutline,
  trashOutline,
  printOutline,
  cloudOfflineOutline,
} from 'ionicons/icons';
import { AuthService } from '../../../core/auth/auth.service';
import { SyncInspectionRepository } from '../../../core/repositories/sync-inspection.repository';
import { ToastService } from '../../../core/services/toast.service';
import { Inspection, InspectionPhoto } from '../../../shared/models/inspection.model';
import { ImagePreviewModalComponent } from '../../../shared/components/image-preview-modal/image-preview-modal.component';
import { StatusColorPipe } from '../../../shared/pipes/status-color.pipe';
import { SyncBadgeComponent } from '../../../shared/components/sync-badge/sync-badge.component';

@Component({
  selector: 'app-inspection-details',
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
    IonBackButton,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonIcon,
    IonBadge,
    IonGrid,
    IonRow,
    IonCol,
    IonFooter,
    StatusColorPipe,
    SyncBadgeComponent,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/inspections"></ion-back-button>
        </ion-buttons>
        <ion-title>Inspection Details</ion-title>
        <ion-buttons slot="end">
          <app-sync-badge></app-sync-badge>
          <ion-button (click)="exportReport()" title="Export Summary">
            <ion-icon name="print-outline" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding details-content">
      @if (inspection(); as item) {
        <!-- Status Hero Card -->
        <ion-card class="status-hero-card">
          <ion-card-content>
            <div class="hero-header">
              <div>
                <span class="hero-id">{{ item.assetId }}</span>
                <h1 class="hero-title">{{ item.assetName }}</h1>
              </div>
              <div class="hero-badges">
                <ion-badge [color]="item.status | statusColor:'status'" class="main-status-badge">
                  {{ item.status.replace('_', ' ') }}
                </ion-badge>
                @if (item.syncStatus !== 'SYNCED') {
                  <ion-badge [color]="item.syncStatus | statusColor:'sync'">
                    <ion-icon name="cloud-offline-outline"></ion-icon>
                    {{ item.syncStatus.replace('_', ' ') }}
                  </ion-badge>
                }
              </div>
            </div>

            <div class="hero-meta-row">
              <div class="meta-item">
                <ion-icon name="location-outline"></ion-icon>
                <span>{{ item.location }}</span>
              </div>
              <div class="meta-item">
                <ion-icon name="calendar-outline"></ion-icon>
                <span>{{ item.inspectionDate | date:'medium' }}</span>
              </div>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Condition & Damage Card -->
        <ion-card class="detail-card">
          <ion-card-header>
            <ion-card-title class="card-heading">Condition & Findings</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div class="condition-row">
              <span class="cond-label">Overall Condition:</span>
              <ion-badge [color]="item.conditionStatus | statusColor:'condition'" class="cond-badge">
                {{ item.conditionStatus }}
              </ion-badge>
            </div>

            @if (item.hasDamage) {
              <div class="damage-alert-banner">
                <div class="dmg-title">
                  <ion-icon name="alert-circle-outline"></ion-icon>
                  <strong>Damage Detected — Severity: {{ item.severity }}</strong>
                </div>
                <p class="dmg-desc">{{ item.damageDescription }}</p>
              </div>
            } @else {
              <div class="no-damage-banner">
                <ion-icon name="checkmark-circle-outline"></ion-icon>
                <span>No damage reported for this asset.</span>
              </div>
            }

            <div class="notes-box">
              <span class="notes-label">Inspector Notes:</span>
              <p class="notes-text">{{ item.notes || 'No additional notes provided.' }}</p>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Attached Photographs -->
        <ion-card class="detail-card">
          <ion-card-header>
            <div class="card-split-header">
              <ion-card-title class="card-heading">Attached Photos</ion-card-title>
              <ion-badge color="medium">{{ item.photos.length }} Photos</ion-badge>
            </div>
          </ion-card-header>
          <ion-card-content>
            @if (item.photos && item.photos.length > 0) {
              <ion-grid class="photo-grid">
                <ion-row>
                  @for (photo of item.photos; track photo.id) {
                    <ion-col size="6" size-sm="4">
                      <div class="photo-thumb-box" (click)="previewPhoto(photo)">
                        <img [src]="photo.dataUrl" alt="Inspection photo" />
                        @if (photo.caption) {
                          <div class="photo-caption-bar">{{ photo.caption }}</div>
                        }
                      </div>
                    </ion-col>
                  }
                </ion-row>
              </ion-grid>
            } @else {
              <p class="empty-subtext">No photographic evidence attached to this inspection.</p>
            }
          </ion-card-content>
        </ion-card>

        <!-- Inspector Sign-off -->
        <ion-card class="detail-card">
          <ion-card-header>
            <ion-card-title class="card-heading">Inspector Sign-Off</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div class="signoff-row">
              <ion-icon name="person-outline"></ion-icon>
              <div>
                <strong>{{ item.inspectorName }}</strong>
                <p class="sub-text">Field Inspector (ID: {{ item.inspectorId }})</p>
              </div>
            </div>

            @if (item.signatureUrl) {
              <div class="signature-display">
                <img [src]="item.signatureUrl" alt="Inspector Signature" class="sig-img" />
                <span class="sig-label">Digital Sign-Off Recorded</span>
              </div>
            }
          </ion-card-content>
        </ion-card>

        <!-- Supervisor Review Section (if reviewed) -->
        @if (item.reviewedAt || item.status === 'APPROVED' || item.status === 'REJECTED') {
          <ion-card class="detail-card supervisor-card">
            <ion-card-header>
              <ion-card-title class="card-heading">Supervisor Review Decision</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <div class="supervisor-review-details">
                <div class="review-status-row">
                  <span>Decision:</span>
                  <ion-badge [color]="item.status | statusColor:'status'">{{ item.status }}</ion-badge>
                </div>
                <div class="review-meta">
                  <span>Reviewed by: <strong>{{ item.supervisorName || 'Supervisor' }}</strong></span>
                  @if (item.reviewedAt) {
                    <span>On: {{ item.reviewedAt | date:'medium' }}</span>
                  }
                </div>
                @if (item.reviewComments) {
                  <div class="comments-box">
                    <span class="comment-label">Supervisor Remarks:</span>
                    <p class="comment-text">{{ item.reviewComments }}</p>
                  </div>
                }
              </div>
            </ion-card-content>
          </ion-card>
        }

        <!-- Audit Trail / History Timeline -->
        <ion-card class="detail-card">
          <ion-card-header>
            <ion-card-title class="card-heading">Inspection History & Audit Trail</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div class="audit-timeline">
              @for (entry of item.history; track entry.id) {
                <div class="timeline-step">
                  <div class="timeline-marker"></div>
                  <div class="timeline-body">
                    <div class="step-head">
                      <strong>{{ entry.actorName }} ({{ entry.actorRole }})</strong>
                      <span class="step-time">{{ entry.timestamp | date:'short' }}</span>
                    </div>
                    <div class="step-desc">
                      <ion-badge [color]="entry.action === 'APPROVED' ? 'success' : entry.action === 'REJECTED' ? 'danger' : 'primary'">
                        {{ entry.action }}
                      </ion-badge>
                      <span class="step-notes">{{ entry.notes }}</span>
                    </div>
                  </div>
                </div>
              }
            </div>
          </ion-card-content>
        </ion-card>
      }
    </ion-content>

    <!-- Contextual Footer Actions -->
    <ion-footer>
      <ion-toolbar class="details-footer">
        @if (inspection()?.status === 'DRAFT') {
          <ion-button expand="block" color="primary" [routerLink]="['/inspections', inspection()?.id, 'edit']">
            <ion-icon name="create-outline" slot="start"></ion-icon>
            Edit & Complete Draft
          </ion-button>
        } @else if (auth.isSupervisor() && inspection()?.status === 'PENDING_APPROVAL') {
          <div class="supervisor-actions">
            <ion-button color="danger" fill="outline" class="action-half" (click)="openRejectDialog()">
              <ion-icon name="close-circle-outline" slot="start"></ion-icon>
              Reject
            </ion-button>
            <ion-button color="success" class="action-half" (click)="confirmApprove()">
              <ion-icon name="checkmark-circle-outline" slot="start"></ion-icon>
              Approve
            </ion-button>
          </div>
        } @else {
          <ion-button expand="block" fill="outline" color="medium" [routerLink]="['/inspections']">
            Back to Inspection List
          </ion-button>
        }
      </ion-toolbar>
    </ion-footer>
  `,
  styles: [
    `
      .details-content {
        --background: #f7f9fc;
        padding-bottom: 24px;
      }
      .status-hero-card {
        border-radius: 14px;
        margin: 0 0 16px 0;
        background: #fff;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      }
      .hero-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 12px;
      }
      .hero-id {
        font-size: 0.8rem;
        font-weight: 700;
        color: #4a5568;
      }
      .hero-title {
        font-size: 1.25rem;
        font-weight: 700;
        color: #1a202c;
        margin: 2px 0 0;
      }
      .hero-badges {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 4px;
      }
      .main-status-badge {
        font-size: 0.85rem;
        padding: 4px 10px;
      }
      .hero-meta-row {
        display: flex;
        flex-direction: column;
        gap: 6px;
        border-top: 1px solid #edf2f7;
        padding-top: 10px;
      }
      .meta-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.85rem;
        color: #718096;
        ion-icon {
          font-size: 16px;
          color: #3880ff;
        }
      }
      .detail-card {
        border-radius: 14px;
        margin: 0 0 16px 0;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      }
      .card-heading {
        font-size: 1.05rem;
        font-weight: 700;
        color: #2d3748;
      }
      .card-split-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .condition-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
      }
      .cond-label {
        font-weight: 600;
        color: #4a5568;
      }
      .cond-badge {
        font-size: 0.9rem;
        padding: 4px 10px;
      }
      .damage-alert-banner {
        background: #fff5f5;
        border: 1px solid #fed7d7;
        border-left: 4px solid #e53e3e;
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 12px;
      }
      .dmg-title {
        display: flex;
        align-items: center;
        gap: 6px;
        color: #c53030;
        margin-bottom: 6px;
        ion-icon {
          font-size: 18px;
        }
      }
      .dmg-desc {
        margin: 0;
        font-size: 0.85rem;
        color: #4a5568;
      }
      .no-damage-banner {
        display: flex;
        align-items: center;
        gap: 6px;
        background: #f0fff4;
        border: 1px solid #c6f6d5;
        color: #276749;
        font-size: 0.85rem;
        padding: 10px 12px;
        border-radius: 8px;
        margin-bottom: 12px;
        ion-icon {
          font-size: 18px;
        }
      }
      .notes-box {
        margin-top: 8px;
      }
      .notes-label {
        font-size: 0.8rem;
        font-weight: 600;
        color: #718096;
        text-transform: uppercase;
      }
      .notes-text {
        margin: 4px 0 0;
        font-size: 0.9rem;
        color: #2d3748;
        line-height: 1.4;
      }
      .photo-grid {
        padding: 0;
      }
      .photo-thumb-box {
        aspect-ratio: 1;
        border-radius: 8px;
        overflow: hidden;
        position: relative;
        cursor: pointer;
        background: #000;
        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      }
      .photo-caption-bar {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: rgba(0, 0, 0, 0.6);
        color: #fff;
        font-size: 0.7rem;
        padding: 2px 4px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .signoff-row {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
        ion-icon {
          font-size: 28px;
          color: #3880ff;
        }
      }
      .sub-text {
        margin: 2px 0 0;
        font-size: 0.8rem;
        color: #718096;
      }
      .signature-display {
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 8px;
        background: #fdfdfd;
        text-align: center;
      }
      .sig-img {
        max-height: 80px;
        margin: 0 auto 4px;
        display: block;
      }
      .sig-label {
        font-size: 0.72rem;
        color: #a0aec0;
        text-transform: uppercase;
      }
      .supervisor-card {
        border-left: 4px solid #3880ff;
      }
      .review-status-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
      }
      .review-meta {
        display: flex;
        justify-content: space-between;
        font-size: 0.85rem;
        color: #718096;
        margin-bottom: 8px;
      }
      .comments-box {
        background: #f8fafc;
        border-radius: 8px;
        padding: 10px;
        margin-top: 8px;
      }
      .comment-label {
        font-size: 0.75rem;
        font-weight: 600;
        color: #718096;
      }
      .comment-text {
        margin: 4px 0 0;
        font-size: 0.88rem;
        color: #2d3748;
      }
      .audit-timeline {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .timeline-step {
        display: flex;
        align-items: flex-start;
        gap: 12px;
      }
      .timeline-marker {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: #3880ff;
        margin-top: 5px;
        flex-shrink: 0;
      }
      .timeline-body {
        flex: 1;
      }
      .step-head {
        display: flex;
        justify-content: space-between;
        font-size: 0.85rem;
      }
      .step-time {
        font-size: 0.75rem;
        color: #a0aec0;
      }
      .step-desc {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 4px;
      }
      .step-notes {
        font-size: 0.8rem;
        color: #4a5568;
      }
      .empty-subtext {
        color: #a0aec0;
        font-size: 0.85rem;
        font-style: italic;
      }
      .details-footer {
        --padding-start: 12px;
        --padding-end: 12px;
      }
      .supervisor-actions {
        display: flex;
        gap: 12px;
        width: 100%;
      }
      .action-half {
        flex: 1;
        --border-radius: 8px;
        font-weight: 600;
      }
    `,
  ],
})
export class InspectionDetailsPage implements OnInit {
  public auth = inject(AuthService);
  private repo = inject(SyncInspectionRepository);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toast = inject(ToastService);
  private modalCtrl = inject(ModalController);
  private alertCtrl = inject(AlertController);

  public inspection = signal<Inspection | null>(null);

  constructor() {
    addIcons({
      cubeOutline,
      calendarOutline,
      locationOutline,
      alertCircleOutline,
      cameraOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      createOutline,
      shieldCheckmarkOutline,
      timeOutline,
      personOutline,
      trashOutline,
      printOutline,
      cloudOfflineOutline,
    });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.loadInspection(id);
      }
    });
  }

  ionViewWillEnter(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadInspection(id);
    }
  }

  private loadInspection(id: string): void {
    this.repo.getById(id).subscribe((item) => {
      this.inspection.set(item);
    });
  }

  async previewPhoto(photo: InspectionPhoto): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: ImagePreviewModalComponent,
      componentProps: { photo, canDelete: false },
    });
    await modal.present();
  }

  async confirmApprove(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Approve Inspection',
      message: 'Are you sure you want to approve this field inspection?',
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
          text: 'Approve',
          handler: (data) => {
            const insp = this.inspection();
            const user = this.auth.currentUser();
            if (insp && user) {
              this.repo.approve(insp.id, user.id, user.name, data.comments).subscribe((updated) => {
                this.inspection.set(updated);
              });
            }
          },
        },
      ],
    });
    await alert.present();
  }

  async openRejectDialog(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Reject Inspection',
      subHeader: 'Reason / Review Comments required',
      inputs: [
        {
          name: 'comments',
          type: 'textarea',
          placeholder: 'Provide corrective actions or missing details...',
        },
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Reject',
          handler: (data) => {
            if (!data.comments || !data.comments.trim()) {
              this.toast.showError('Rejection comments are required.');
              return false;
            }
            const insp = this.inspection();
            const user = this.auth.currentUser();
            if (insp && user) {
              this.repo.reject(insp.id, user.id, user.name, data.comments.trim()).subscribe((updated) => {
                this.inspection.set(updated);
              });
            }
            return true;
          },
        },
      ],
    });
    await alert.present();
  }

  exportReport(): void {
    window.print();
  }
}
