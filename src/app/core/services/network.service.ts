import { Injectable, computed, signal } from '@angular/core';
import { Network } from '@capacitor/network';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class NetworkService {
  private rawOnlineSignal = signal<boolean>(navigator.onLine ?? true);
  private simulatedOfflineSignal = signal<boolean>(false);

  // Observable stream for subscribers who use RxJS
  private statusChanges$ = new Subject<boolean>();
  public readonly onStatusChange = this.statusChanges$.asObservable();

  // Signals for modern Angular UI
  public readonly isDeviceOnline = this.rawOnlineSignal.asReadonly();
  public readonly isSimulatedOffline = this.simulatedOfflineSignal.asReadonly();

  // Effective status combines real network status and test simulation
  public readonly isOnline = computed(() => {
    return this.rawOnlineSignal() && !this.simulatedOfflineSignal();
  });

  constructor() {
    this.initNetworkListener();
  }

  private async initNetworkListener(): Promise<void> {
    try {
      const status = await Network.getStatus();
      this.rawOnlineSignal.set(status.connected);
    } catch {
      this.rawOnlineSignal.set(navigator.onLine);
    }

    try {
      Network.addListener('networkStatusChange', (status) => {
        this.rawOnlineSignal.set(status.connected);
        this.statusChanges$.next(this.isOnline());
      });
    } catch {
      // Fallback to browser window events
      window.addEventListener('online', () => {
        this.rawOnlineSignal.set(true);
        this.statusChanges$.next(this.isOnline());
      });
      window.addEventListener('offline', () => {
        this.rawOnlineSignal.set(false);
        this.statusChanges$.next(this.isOnline());
      });
    }
  }

  /**
   * Toggle simulated offline mode to easily demonstrate/test
   * offline queuing and recovery on any device or desktop browser.
   */
  public toggleSimulatedOffline(): boolean {
    const nextState = !this.simulatedOfflineSignal();
    this.simulatedOfflineSignal.set(nextState);
    this.statusChanges$.next(this.isOnline());
    return nextState;
  }

  public setSimulatedOffline(offline: boolean): void {
    this.simulatedOfflineSignal.set(offline);
    this.statusChanges$.next(this.isOnline());
  }
}
