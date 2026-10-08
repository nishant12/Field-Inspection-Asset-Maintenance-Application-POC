import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonItem,
  IonInput,
  IonButton,
  IonIcon,
  IonNote,
  IonChip,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  lockClosedOutline,
  mailOutline,
  personOutline,
  shieldCheckmarkOutline,
  buildOutline,
  cloudOfflineOutline,
} from 'ionicons/icons';
import { AuthService } from '../../../core/auth/auth.service';
import { UserRole } from '../../../core/auth/user.model';
import { NetworkService } from '../../../core/services/network.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonItem,
    IonInput,
    IonButton,
    IonIcon,
    IonNote,
    IonChip,
  ],
  template: `
    <ion-content class="login-content" color="light">
      <div class="login-wrapper">
        <div class="brand-header">
          <div class="logo-circle">
            <ion-icon name="shield-checkmark-outline"></ion-icon>
          </div>
          <h1 class="app-title">FieldGuard Pro</h1>
          <p class="app-tagline">Inspection & Asset Maintenance Platform</p>
          <div class="status-indicator">
            @if (network.isOnline()) {
              <ion-chip color="success" class="net-chip">
                <span class="pulse-dot online"></span> Online Mode
              </ion-chip>
            } @else {
              <ion-chip color="warning" class="net-chip">
                <ion-icon name="cloud-offline-outline"></ion-icon>
                <span>Offline Capable</span>
              </ion-chip>
            }
          </div>
        </div>

        <ion-card class="login-card">
          <ion-card-header>
            <ion-card-title>Authentication</ion-card-title>
            <ion-card-subtitle>Sign in to your enterprise account</ion-card-subtitle>
          </ion-card-header>

          <ion-card-content>
            <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
              <ion-item lines="inset" class="form-item">
                <ion-icon name="mail-outline" slot="start" color="primary"></ion-icon>
                <ion-input
                  label="Corporate Email"
                  labelPlacement="floating"
                  type="email"
                  formControlName="email"
                  placeholder="name@fieldservice.com"
                ></ion-input>
              </ion-item>
              @if (loginForm.get('email')?.touched && loginForm.get('email')?.invalid) {
                <ion-note color="danger" class="input-error">Valid email address is required</ion-note>
              }

              <ion-item lines="inset" class="form-item">
                <ion-icon name="lock-closed-outline" slot="start" color="primary"></ion-icon>
                <ion-input
                  label="Password"
                  labelPlacement="floating"
                  type="password"
                  formControlName="password"
                  placeholder="••••••••"
                ></ion-input>
              </ion-item>

              <ion-button expand="block" type="submit" class="submit-btn" [disabled]="loginForm.invalid">
                Sign In
              </ion-button>
            </form>

            <div class="demo-separator">
              <span>Quick Demo Sign-In</span>
            </div>

            <div class="quick-roles">
              <ion-button expand="block" color="primary" fill="outline" (click)="quickLogin('EMPLOYEE')" class="role-btn">
                <ion-icon name="build-outline" slot="start"></ion-icon>
                Field Engineer (Alex Carter)
              </ion-button>

              <ion-button expand="block" color="secondary" fill="outline" (click)="quickLogin('SUPERVISOR')" class="role-btn">
                <ion-icon name="person-outline" slot="start"></ion-icon>
                Supervisor (Sarah Jenkins)
              </ion-button>
            </div>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  `,
  styles: [
    `
      .login-content {
        --background: #f4f6f9;
      }
      .login-wrapper {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        min-height: 100%;
        padding: 24px 16px;
      }
      .brand-header {
        text-align: center;
        margin-bottom: 20px;
      }
      .logo-circle {
        width: 68px;
        height: 68px;
        background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 12px;
        box-shadow: 0 4px 12px rgba(30, 60, 114, 0.3);
        ion-icon {
          font-size: 36px;
          color: #fff;
        }
      }
      .app-title {
        font-size: 1.6rem;
        font-weight: 700;
        color: #1a202c;
        margin: 0;
      }
      .app-tagline {
        font-size: 0.9rem;
        color: #718096;
        margin: 4px 0 10px;
      }
      .net-chip {
        font-size: 0.75rem;
        height: 24px;
      }
      .pulse-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        margin-right: 6px;
        background: #2dd36f;
        box-shadow: 0 0 6px #2dd36f;
      }
      .login-card {
        width: 100%;
        max-width: 440px;
        border-radius: 16px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
      }
      .form-item {
        margin-bottom: 12px;
        --border-radius: 8px;
      }
      .input-error {
        display: block;
        padding-left: 16px;
        margin-bottom: 8px;
        font-size: 0.75rem;
      }
      .submit-btn {
        margin-top: 16px;
        --border-radius: 8px;
        font-weight: 600;
      }
      .demo-separator {
        position: relative;
        text-align: center;
        margin: 24px 0 16px;
        &::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 1px;
          background: #e2e8f0;
        }
        span {
          position: relative;
          background: #fff;
          padding: 0 12px;
          font-size: 0.75rem;
          color: #a0aec0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
      }
      .quick-roles {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .role-btn {
        --border-radius: 8px;
        font-size: 0.85rem;
        text-transform: none;
        font-weight: 500;
      }
    `,
  ],
})
export class LoginPage {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);
  public network = inject(NetworkService);

  loginForm = this.fb.group({
    email: ['alex@fieldservice.com', [Validators.required, Validators.email]],
    password: ['password123', [Validators.required, Validators.minLength(4)]],
  });

  constructor() {
    addIcons({
      lockClosedOutline,
      mailOutline,
      personOutline,
      shieldCheckmarkOutline,
      buildOutline,
      cloudOfflineOutline,
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;
    const { email } = this.loginForm.value;
    if (email) {
      this.auth.login(email);
      this.toast.showSuccess('Signed in successfully');
      this.router.navigate(['/dashboard']);
    }
  }

  quickLogin(role: UserRole): void {
    this.auth.quickSwitchRole(role);
    this.toast.showSuccess(`Signed in as ${role === 'SUPERVISOR' ? 'Supervisor' : 'Field Engineer'}`);
    this.router.navigate(['/dashboard']);
  }
}
