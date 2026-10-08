import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonBadge,
  IonButton,
  IonIcon,
  IonSpinner,
  ActionSheetController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  cloudDoneOutline,
  cloudOfflineOutline,
  syncOutline,
  wifiOutline,
  alertCircleOutline,
  ellipsisVertical,
} from 'ionicons/icons';
import { NetworkService } from '../../../core/services/network.service';
import { SyncQueueService } from '../../../core/sync/sync-queue.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-sync-badge',
  standalone: true,
  imports: [CommonModule, IonBadge, IonButton, IonIcon, IonSpinner],
  template: `
    <div class="sync-badge-container">
      @if (syncQueue.isSyncing()) {
        <ion-button size="small" fill="clear" color="primary" class="sync-btn syncing">
          <ion-spinner name="crescent" class="sync-spinner"></ion-spinner>
          <span class="btn-text">Syncing...</span>
        </ion-button>
      } @else {
        <ion-button size="small" fill="clear" [color]="network.isOnline() ? 'success' : 'warning'" (click)="openSyncSheet()">
          @if (network.isOnline()) {
            <ion-icon name="wifi-outline" slot="start"></ion-icon>
            <span class="btn-text">Online</span>
          } @else {
            <ion-icon name="cloud-offline-outline" slot="start"></ion-icon>
            <span class="btn-text">Offline</span>
          }

          @if (syncQueue.pendingCount() > 0) {
            <ion-badge color="warning" class="queue-badge">{{ syncQueue.pendingCount() }}</ion-badge>
          }
          @if (syncQueue.failedCount() > 0) {
            <ion-badge color="danger" class="queue-badge">{{ syncQueue.failedCount() }} !</ion-badge>
          }
        </ion-button>
      }
    </div>
  `,
  styles: [
    `
      .sync-badge-container {
        display: flex;
        align-items: center;
      }
      .sync-btn {
        --padding-start: 6px;
        --padding-end: 6px;
        font-size: 0.75rem;
        height: 28px;
        text-transform: none;
      }
      .btn-text {
        font-weight: 600;
        letter-spacing: 0.2px;
      }
      .sync-spinner {
        width: 14px;
        height: 14px;
        margin-right: 4px;
      }
      .queue-badge {
        margin-left: 5px;
        font-size: 0.7rem;
        border-radius: 10px;
        padding: 2px 6px;
      }
    `,
  ],
})
export class SyncBadgeComponent {
  public network = inject(NetworkService);
  public syncQueue = inject(SyncQueueService);
  private actionSheetCtrl = inject(ActionSheetController);
  private toast = inject(ToastService);

  constructor() {
    addIcons({
      cloudDoneOutline,
      cloudOfflineOutline,
      syncOutline,
      wifiOutline,
      alertCircleOutline,
      ellipsisVertical,
    });
  }

  async openSyncSheet(): Promise<void> {
    const isSimulated = this.network.isSimulatedOffline();
    const isOnline = this.network.isOnline();
    const pending = this.syncQueue.pendingCount();

    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Connectivity & Sync Manager',
      subHeader: `Status: ${isOnline ? 'Connected' : 'Offline'} | Queued: ${pending}`,
      buttons: [
        {
          text: 'Sync Queue Now',
          icon: 'sync-outline',
          handler: () => {
            if (!this.network.isOnline()) {
              this.toast.showWarning('Cannot sync while offline. Restore connection first.');
              return;
            }
            this.syncQueue.processQueue();
          },
        },
        {
          text: isSimulated ? 'Disable Simulated Offline' : 'Simulate Offline Mode (Testing)',
          icon: isSimulated ? 'wifi-outline' : 'cloud-offline-outline',
          handler: () => {
            const nowOffline = this.network.toggleSimulatedOffline();
            this.toast.showInfo(nowOffline ? 'Simulated Offline Mode enabled' : 'Online mode restored');
          },
        },
        {
          text: 'Cancel',
          role: 'cancel',
        },
      ],
    });

    await actionSheet.present();
  }
}
