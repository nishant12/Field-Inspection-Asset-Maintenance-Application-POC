import { Component, Input, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonIcon,
  IonFooter,
  ModalController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { closeOutline, trashOutline, shareOutline } from 'ionicons/icons';
import { InspectionPhoto } from '../../models/inspection.model';

@Component({
  selector: 'app-image-preview-modal',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonIcon,
    IonFooter,
  ],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar color="dark">
        <ion-title>{{ photo?.caption || 'Photo Preview' }}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="close()">
            <ion-icon name="close-outline" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content color="dark" class="ion-padding preview-content">
      <div class="image-wrapper">
        <img [src]="photo?.dataUrl" [alt]="photo?.caption || 'Inspection photo'" class="preview-img" />
      </div>

      <div class="metadata-card" *ngIf="photo">
        <div class="meta-row">
          <span class="meta-label">Captured:</span>
          <span class="meta-value">{{ photo.timestamp | date:'medium' }}</span>
        </div>
        <div class="meta-row" *ngIf="photo.sizeKb">
          <span class="meta-label">File Size:</span>
          <span class="meta-value">{{ photo.sizeKb }} KB</span>
        </div>
        <div class="meta-row" *ngIf="photo.caption">
          <span class="meta-label">Caption:</span>
          <span class="meta-value">{{ photo.caption }}</span>
        </div>
      </div>
    </ion-content>

    <ion-footer color="dark" *ngIf="canDelete">
      <ion-toolbar color="dark">
        <ion-button expand="block" color="danger" fill="outline" (click)="deletePhoto()">
          <ion-icon name="trash-outline" slot="start"></ion-icon>
          Remove This Attachment
        </ion-button>
      </ion-toolbar>
    </ion-footer>
  `,
  styles: [
    `
      .preview-content {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center;
      }
      .image-wrapper {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        max-height: 65vh;
        overflow: hidden;
        margin-bottom: 1rem;
        background: #000;
        border-radius: 12px;
      }
      .preview-img {
        max-width: 100%;
        max-height: 65vh;
        object-fit: contain;
      }
      .metadata-card {
        background: rgba(255, 255, 255, 0.08);
        border-radius: 10px;
        padding: 12px;
        text-align: left;
        font-size: 0.9rem;
      }
      .meta-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 6px;
      }
      .meta-label {
        color: var(--ion-color-medium-tint);
      }
      .meta-value {
        color: #fff;
        font-weight: 500;
      }
    `,
  ],
})
export class ImagePreviewModalComponent {
  @Input() photo?: InspectionPhoto;
  @Input() canDelete: boolean = false;

  private modalCtrl = inject(ModalController);

  constructor() {
    addIcons({ closeOutline, trashOutline, shareOutline });
  }

  close(): void {
    this.modalCtrl.dismiss(null, 'close');
  }

  deletePhoto(): void {
    this.modalCtrl.dismiss({ deleted: true, photoId: this.photo?.id }, 'delete');
  }
}
