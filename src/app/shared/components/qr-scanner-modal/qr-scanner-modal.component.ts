import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  ModalController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { closeOutline, qrCodeOutline, scanOutline, flashOutline } from 'ionicons/icons';
import { MOCK_ASSETS } from '../../../core/services/mock-data';
import { AssetReference } from '../../models/inspection.model';

@Component({
  selector: 'app-qr-scanner-modal',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    IonBadge,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Asset QR Scanner</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="cancel()">
            <ion-icon name="close-outline" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <!-- Simulated Camera Viewfinder -->
      <div class="viewfinder-box">
        <div class="laser-scanner"></div>
        <div class="corner top-left"></div>
        <div class="corner top-right"></div>
        <div class="corner bottom-left"></div>
        <div class="corner bottom-right"></div>
        <div class="viewfinder-text">
          <ion-icon name="scan-outline"></ion-icon>
          <p>Align Asset QR Tag within Frame</p>
        </div>
      </div>

      <div class="section-title">
        <h3>Or select verified facility asset:</h3>
      </div>

      <ion-list lines="inset">
        @for (asset of assets; track asset.id) {
          <ion-item button (click)="selectAsset(asset)">
            <ion-icon name="qr-code-outline" slot="start" color="primary"></ion-icon>
            <ion-label>
              <h2>{{ asset.name }}</h2>
              <p>{{ asset.facility }} &bull; {{ asset.category }}</p>
            </ion-label>
            <ion-badge color="tertiary" slot="end">{{ asset.id }}</ion-badge>
          </ion-item>
        }
      </ion-list>
    </ion-content>
  `,
  styles: [
    `
      .viewfinder-box {
        position: relative;
        height: 220px;
        background: #121820;
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        margin-bottom: 24px;
        box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.8);
      }
      .laser-scanner {
        position: absolute;
        top: 0;
        left: 5%;
        width: 90%;
        height: 2px;
        background: #3880ff;
        box-shadow: 0 0 8px #3880ff;
        animation: scanAnim 2s infinite ease-in-out alternate;
      }
      @keyframes scanAnim {
        0% { top: 15%; }
        100% { top: 85%; }
      }
      .corner {
        position: absolute;
        width: 20px;
        height: 20px;
        border: 3px solid #3880ff;
      }
      .top-left { top: 20px; left: 20px; border-right: none; border-bottom: none; }
      .top-right { top: 20px; right: 20px; border-left: none; border-bottom: none; }
      .bottom-left { bottom: 20px; left: 20px; border-right: none; border-top: none; }
      .bottom-right { bottom: 20px; right: 20px; border-left: none; border-top: none; }
      .viewfinder-text {
        text-align: center;
        color: #92949c;
        ion-icon {
          font-size: 38px;
          color: #3880ff;
          margin-bottom: 6px;
        }
        p {
          margin: 0;
          font-size: 0.85rem;
          font-weight: 500;
        }
      }
      .section-title h3 {
        font-size: 0.95rem;
        font-weight: 600;
        color: var(--ion-color-step-600, #666);
        margin: 0 0 8px 4px;
      }
    `,
  ],
})
export class QrScannerModalComponent {
  public assets = MOCK_ASSETS;
  private modalCtrl = inject(ModalController);

  constructor() {
    addIcons({ closeOutline, qrCodeOutline, scanOutline, flashOutline });
  }

  cancel(): void {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  selectAsset(asset: AssetReference): void {
    this.modalCtrl.dismiss({ asset }, 'selected');
  }
}
