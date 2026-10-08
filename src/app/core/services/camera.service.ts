import { Injectable, inject } from '@angular/core';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { InspectionPhoto } from '../../shared/models/inspection.model';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root',
})
export class CameraService {
  private toast = inject(ToastService);

  async checkOrRequestPermissions(): Promise<boolean> {
    try {
      const status = await Camera.checkPermissions();
      if (status.camera === 'granted' || status.photos === 'granted') {
        return true;
      }
      const requested = await Camera.requestPermissions();
      return requested.camera === 'granted' || requested.photos === 'granted';
    } catch {
      // In web browser or mock environment, allow continuing
      return true;
    }
  }

  async capturePhoto(): Promise<InspectionPhoto | null> {
    const hasPermission = await this.checkOrRequestPermissions();
    if (!hasPermission) {
      await this.toast.showWarning('Camera permission was denied. Please allow camera access in device settings.');
      return null;
    }

    try {
      const photo: Photo = await Camera.getPhoto({
        quality: 85,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        width: 1280,
      });

      if (!photo.dataUrl) {
        return null;
      }

      const sizeKb = Math.round((photo.dataUrl.length * 3) / 4 / 1024);

      return {
        id: 'photo_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        dataUrl: photo.dataUrl,
        timestamp: new Date().toISOString(),
        sizeKb,
      };
    } catch (err: any) {
      if (err?.message?.includes('User cancelled') || err === 'User cancelled photos app') {
        // User cancelled, quiet exit
        return null;
      }
      console.warn('Camera capture fallback:', err);
      // Fallback: trigger file input picker
      return this.pickPhotoFromFilePicker();
    }
  }

  async selectFromGallery(): Promise<InspectionPhoto | null> {
    try {
      const photo: Photo = await Camera.getPhoto({
        quality: 85,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
        width: 1280,
      });

      if (!photo.dataUrl) {
        return null;
      }

      const sizeKb = Math.round((photo.dataUrl.length * 3) / 4 / 1024);

      return {
        id: 'photo_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        dataUrl: photo.dataUrl,
        timestamp: new Date().toISOString(),
        sizeKb,
      };
    } catch (err: any) {
      if (err?.message?.includes('User cancelled') || err === 'User cancelled photos app') {
        return null;
      }
      return this.pickPhotoFromFilePicker();
    }
  }

  /**
   * Fallback file picker for web browsers when Capacitor Camera
   * native interface is unavailable.
   */
  public pickPhotoFromFilePicker(): Promise<InspectionPhoto | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e: any) => {
        const file: File = e.target.files?.[0];
        if (!file) {
          resolve(null);
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          resolve({
            id: 'photo_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
            dataUrl,
            caption: file.name,
            timestamp: new Date().toISOString(),
            sizeKb: Math.round(file.size / 1024),
          });
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      };
      input.click();
    });
  }
}
