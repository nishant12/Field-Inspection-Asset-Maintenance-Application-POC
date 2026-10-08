import { Injectable, inject } from '@angular/core';
import { ToastController } from '@ionic/angular';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private toastCtrl = inject(ToastController);

  async showSuccess(message: string, duration = 2500): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration,
      color: 'success',
      position: 'top',
      icon: 'checkmark-circle-outline',
      buttons: [{ text: 'OK', role: 'cancel' }],
    });
    await toast.present();
  }

  async showError(message: string, duration = 3500): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration,
      color: 'danger',
      position: 'top',
      icon: 'alert-circle-outline',
      buttons: [{ text: 'DISMISS', role: 'cancel' }],
    });
    await toast.present();
  }

  async showWarning(message: string, duration = 3000): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration,
      color: 'warning',
      position: 'top',
      icon: 'warning-outline',
      buttons: [{ text: 'OK', role: 'cancel' }],
    });
    await toast.present();
  }

  async showInfo(message: string, duration = 2500): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration,
      color: 'medium',
      position: 'bottom',
      icon: 'information-circle-outline',
      buttons: [{ text: 'OK', role: 'cancel' }],
    });
    await toast.present();
  }
}
