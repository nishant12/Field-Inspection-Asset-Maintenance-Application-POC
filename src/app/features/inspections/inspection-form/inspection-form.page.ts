import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
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
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonRadioGroup,
  IonRadio,
  IonTextarea,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonNote,
  IonBadge,
  IonFooter,
  ModalController,
  AlertController,
  ActionSheetController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  cameraOutline,
  imageOutline,
  qrCodeOutline,
  trashOutline,
  eyeOutline,
  checkmarkCircleOutline,
  saveOutline,
  sendOutline,
  alertCircleOutline,
  locationOutline,
  fingerPrintOutline,
} from 'ionicons/icons';
import { AuthService } from '../../../core/auth/auth.service';
import { SyncInspectionRepository } from '../../../core/repositories/sync-inspection.repository';
import { CameraService } from '../../../core/services/camera.service';
import { ToastService } from '../../../core/services/toast.service';
import {
  ConditionStatus,
  Inspection,
  InspectionPhoto,
  SeverityLevel,
} from '../../../shared/models/inspection.model';
import { QrScannerModalComponent } from '../../../shared/components/qr-scanner-modal/qr-scanner-modal.component';
import { ImagePreviewModalComponent } from '../../../shared/components/image-preview-modal/image-preview-modal.component';
import { SignaturePadComponent } from '../../../shared/components/signature-pad/signature-pad.component';
import { MOCK_ASSETS } from '../../../core/services/mock-data';

@Component({
  selector: 'app-inspection-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
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
    IonItem,
    IonLabel,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonRadioGroup,
    IonRadio,
    IonTextarea,
    IonIcon,
    IonGrid,
    IonRow,
    IonCol,
    IonNote,
    IonBadge,
    IonFooter,
    SignaturePadComponent,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/inspections"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ isEditMode ? 'Edit Inspection' : 'New Inspection' }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding form-content">
      <form [formGroup]="inspectionForm">
        <!-- 1. Asset & Basic Information -->
        <ion-card class="form-section-card">
          <ion-card-header>
            <ion-card-title class="section-heading">Asset Identification</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div class="asset-scan-bar">
              <ion-item lines="inset" class="flex-item">
                <ion-label position="stacked">Asset Code / ID *</ion-label>
                <ion-input
                  formControlName="assetId"
                  placeholder="e.g. AST-PUMP-001"
                  (ionChange)="onAssetIdChange()"
                ></ion-input>
              </ion-item>
              <ion-button fill="outline" color="primary" class="scan-btn" (click)="openQrScanner()">
                <ion-icon name="qr-code-outline" slot="icon-only"></ion-icon>
              </ion-button>
            </div>
            @if (inspectionForm.get('assetId')?.touched && inspectionForm.get('assetId')?.invalid) {
              <ion-note color="danger" class="field-error">Asset ID is required</ion-note>
            }

            <ion-item lines="inset">
              <ion-label position="stacked">Asset Title</ion-label>
              <ion-input formControlName="assetName" placeholder="Asset description"></ion-input>
            </ion-item>

            <ion-item lines="inset">
              <ion-label position="stacked">Facility / Location</ion-label>
              <ion-input formControlName="location" placeholder="e.g. Sector 4 - Hydro Plant"></ion-input>
            </ion-item>

            <ion-item lines="inset">
              <ion-label position="stacked">Inspection Date *</ion-label>
              <ion-input type="datetime-local" formControlName="inspectionDate"></ion-input>
            </ion-item>
          </ion-card-content>
        </ion-card>

        <!-- 2. Equipment Condition & Damage Questions -->
        <ion-card class="form-section-card">
          <ion-card-header>
            <ion-card-title class="section-heading">Condition & Findings</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-item lines="inset">
              <ion-label position="stacked">Condition Status *</ion-label>
              <ion-select formControlName="conditionStatus" interface="action-sheet" placeholder="Select condition">
                <ion-select-option value="GOOD">Good — Normal operating parameters</ion-select-option>
                <ion-select-option value="FAIR">Fair — Minor cosmetic or wear</ion-select-option>
                <ion-select-option value="POOR">Poor — Functional impairment / risk</ion-select-option>
                <ion-select-option value="CRITICAL">Critical — Immediate safety / shutdown threat</ion-select-option>
              </ion-select>
            </ion-item>

            <!-- Damage Detected Radio (Conditional Trigger) -->
            <div class="damage-radio-container">
              <ion-label class="radio-label">Is Equipment Damage Detected? *</ion-label>
              <ion-radio-group formControlName="hasDamage" (ionChange)="onDamageToggle()">
                <div class="radio-options">
                  <ion-item lines="none" class="radio-pill">
                    <ion-radio [value]="false">No Damage</ion-radio>
                  </ion-item>
                  <ion-item lines="none" class="radio-pill">
                    <ion-radio [value]="true">Damage Present</ion-radio>
                  </ion-item>
                </div>
              </ion-radio-group>
            </div>

            <!-- Conditional Validation Fields -->
            @if (inspectionForm.get('hasDamage')?.value) {
              <div class="conditional-damage-box">
                <div class="damage-header">
                  <ion-icon name="alert-circle-outline"></ion-icon>
                  <span>Required Damage Assessment</span>
                </div>

                <ion-item lines="inset" class="damage-input-item">
                  <ion-label position="stacked">Damage Severity Rating *</ion-label>
                  <ion-select formControlName="severity" interface="action-sheet" placeholder="Select Severity">
                    <ion-select-option value="LOW">Low (Minor wear / monitoring needed)</ion-select-option>
                    <ion-select-option value="MEDIUM">Medium (Requires maintenance schedule)</ion-select-option>
                    <ion-select-option value="HIGH">High (Urgent repair needed)</ion-select-option>
                    <ion-select-option value="CRITICAL">Critical (Immediate shutdown)</ion-select-option>
                  </ion-select>
                </ion-item>
                @if (inspectionForm.get('severity')?.touched && inspectionForm.get('severity')?.invalid) {
                  <ion-note color="danger" class="field-error">Severity rating is mandatory when damage is present</ion-note>
                }

                <ion-item lines="inset" class="damage-input-item">
                  <ion-label position="stacked">Damage Description *</ion-label>
                  <ion-textarea
                    formControlName="damageDescription"
                    rows="3"
                    placeholder="Describe specific crack, leak, abnormal vibration, or thermal reading..."
                  ></ion-textarea>
                </ion-item>
                @if (inspectionForm.get('damageDescription')?.touched && inspectionForm.get('damageDescription')?.invalid) {
                  <ion-note color="danger" class="field-error">Damage description is required when damage is flagged</ion-note>
                }
              </div>
            }

            <ion-item lines="inset">
              <ion-label position="stacked">General Inspection Notes *</ion-label>
              <ion-textarea
                formControlName="notes"
                rows="3"
                placeholder="Operational notes, meter readings, lubrication status..."
              ></ion-textarea>
            </ion-item>
            @if (inspectionForm.get('notes')?.touched && inspectionForm.get('notes')?.invalid) {
              <ion-note color="danger" class="field-error">Inspection notes are required</ion-note>
            }
          </ion-card-content>
        </ion-card>

        <!-- 3. Camera & Photo Attachments -->
        <ion-card class="form-section-card">
          <ion-card-header>
            <div class="section-header-split">
              <ion-card-title class="section-heading">Photographic Attachments</ion-card-title>
              <ion-badge color="medium">{{ photos().length }} Attached</ion-badge>
            </div>
          </ion-card-header>
          <ion-card-content>
            <div class="photo-btn-row">
              <ion-button expand="block" color="primary" fill="outline" (click)="capturePhoto()">
                <ion-icon name="camera-outline" slot="start"></ion-icon>
                Take Photo
              </ion-button>
              <ion-button expand="block" color="secondary" fill="outline" (click)="selectPhoto()">
                <ion-icon name="image-outline" slot="start"></ion-icon>
                Gallery / Files
              </ion-button>
            </div>

            <!-- Photo Thumbnails Grid -->
            @if (photos().length > 0) {
              <ion-grid class="photo-grid">
                <ion-row>
                  @for (photo of photos(); track photo.id; let i = $index) {
                    <ion-col size="4" size-sm="3">
                      <div class="thumbnail-wrapper" (click)="previewPhoto(photo)">
                        <img [src]="photo.dataUrl" alt="Attachment" class="thumbnail-img" />
                        <button type="button" class="del-btn" (click)="removePhoto($event, i)">
                          <ion-icon name="trash-outline"></ion-icon>
                        </button>
                      </div>
                    </ion-col>
                  }
                </ion-row>
              </ion-grid>
            } @else {
              <div class="no-photos-box">
                <ion-icon name="camera-outline"></ion-icon>
                <p>No photos attached. Capture visual evidence of asset condition.</p>
              </div>
            }
          </ion-card-content>
        </ion-card>

        <!-- 4. Sign-Off & Geolocation -->
        <ion-card class="form-section-card">
          <ion-card-header>
            <ion-card-title class="section-heading">Verification & Sign-Off</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div class="inspector-badge">
              <span>Inspector:</span>
              <strong>{{ auth.currentUser()?.name }} ({{ auth.currentUser()?.id }})</strong>
            </div>

            <div class="sig-section">
              <app-signature-pad
                title="Field Inspector Signature"
                [existingSignature]="existingSignature"
                (signatureChange)="onSignatureChange($event)"
              ></app-signature-pad>
            </div>
          </ion-card-content>
        </ion-card>
      </form>
    </ion-content>

    <ion-footer>
      <ion-toolbar class="footer-toolbar">
        <div class="footer-action-buttons">
          <ion-button fill="outline" color="medium" (click)="saveAsDraft()" class="half-btn">
            <ion-icon name="save-outline" slot="start"></ion-icon>
            Save Draft
          </ion-button>
          <ion-button color="primary" (click)="submitInspection()" class="half-btn">
            <ion-icon name="send-outline" slot="start"></ion-icon>
            Submit
          </ion-button>
        </div>
      </ion-toolbar>
    </ion-footer>
  `,
  styles: [
    `
      .form-content {
        --background: #f7f9fc;
        padding-bottom: 24px;
      }
      .form-section-card {
        border-radius: 14px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        margin: 0 0 16px 0;
      }
      .section-heading {
        font-size: 1.05rem;
        font-weight: 700;
        color: #2d3748;
      }
      .section-header-split {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .asset-scan-bar {
        display: flex;
        align-items: flex-end;
        gap: 8px;
      }
      .flex-item {
        flex: 1;
      }
      .scan-btn {
        margin-bottom: 4px;
        height: 50px;
      }
      .damage-radio-container {
        margin: 16px 0 12px;
      }
      .radio-label {
        font-size: 0.85rem;
        font-weight: 600;
        color: #4a5568;
        display: block;
        margin-bottom: 6px;
      }
      .radio-options {
        display: flex;
        gap: 8px;
      }
      .radio-pill {
        flex: 1;
        --background: #f1f5f9;
        --border-radius: 8px;
      }
      .conditional-damage-box {
        background: #fffaf0;
        border: 1px solid #feebc8;
        border-left: 4px solid #dd6b20;
        border-radius: 8px;
        padding: 12px;
        margin: 12px 0 16px;
      }
      .damage-header {
        display: flex;
        align-items: center;
        gap: 6px;
        color: #c05621;
        font-weight: 700;
        font-size: 0.9rem;
        margin-bottom: 8px;
        ion-icon {
          font-size: 18px;
        }
      }
      .damage-input-item {
        --background: transparent;
      }
      .field-error {
        display: block;
        padding-left: 14px;
        margin: 4px 0 8px;
        font-size: 0.75rem;
      }
      .photo-btn-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        margin-bottom: 12px;
      }
      .photo-grid {
        padding: 0;
      }
      .thumbnail-wrapper {
        position: relative;
        aspect-ratio: 1;
        border-radius: 8px;
        overflow: hidden;
        background: #e2e8f0;
      }
      .thumbnail-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .del-btn {
        position: absolute;
        top: 4px;
        right: 4px;
        background: rgba(235, 68, 90, 0.9);
        color: #fff;
        border: none;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        ion-icon {
          font-size: 14px;
        }
      }
      .no-photos-box {
        text-align: center;
        padding: 24px;
        border: 2px dashed #e2e8f0;
        border-radius: 10px;
        color: #a0aec0;
        ion-icon {
          font-size: 32px;
          margin-bottom: 4px;
        }
        p {
          font-size: 0.8rem;
          margin: 0;
        }
      }
      .inspector-badge {
        font-size: 0.85rem;
        color: #4a5568;
        margin-bottom: 12px;
        span {
          color: #718096;
          margin-right: 4px;
        }
      }
      .footer-toolbar {
        --padding-start: 12px;
        --padding-end: 12px;
      }
      .footer-action-buttons {
        display: flex;
        gap: 12px;
        width: 100%;
      }
      .half-btn {
        flex: 1;
        --border-radius: 8px;
        font-weight: 600;
      }
    `,
  ],
})
export class InspectionFormPage implements OnInit {
  private fb = inject(FormBuilder);
  private repo = inject(SyncInspectionRepository);
  private camera = inject(CameraService);
  public auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);
  private modalCtrl = inject(ModalController);
  private alertCtrl = inject(AlertController);

  public isEditMode = false;
  public inspectionId?: string;
  public photos = signal<InspectionPhoto[]>([]);
  public existingSignature?: string;
  private signatureDataUrl?: string;

  inspectionForm: FormGroup = this.fb.group({
    assetId: ['', [Validators.required]],
    assetName: [''],
    assetCategory: ['General Equipment'],
    location: [''],
    inspectionDate: [new Date().toISOString().substring(0, 16), [Validators.required]],
    conditionStatus: ['GOOD' as ConditionStatus, [Validators.required]],
    hasDamage: [false, [Validators.required]],
    damageDescription: [''],
    severity: ['LOW' as SeverityLevel],
    notes: ['', [Validators.required]],
  });

  constructor() {
    addIcons({
      cameraOutline,
      imageOutline,
      qrCodeOutline,
      trashOutline,
      eyeOutline,
      checkmarkCircleOutline,
      saveOutline,
      sendOutline,
      alertCircleOutline,
      locationOutline,
      fingerPrintOutline,
    });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id && id !== 'new') {
        this.isEditMode = true;
        this.inspectionId = id;
        this.loadExistingInspection(id);
      }
    });
  }

  private loadExistingInspection(id: string): void {
    this.repo.getById(id).subscribe((inspection) => {
      if (inspection) {
        this.inspectionForm.patchValue({
          assetId: inspection.assetId,
          assetName: inspection.assetName,
          assetCategory: inspection.assetCategory,
          location: inspection.location,
          inspectionDate: inspection.inspectionDate ? inspection.inspectionDate.substring(0, 16) : '',
          conditionStatus: inspection.conditionStatus,
          hasDamage: inspection.hasDamage,
          damageDescription: inspection.damageDescription || '',
          severity: inspection.severity || 'LOW',
          notes: inspection.notes,
        });

        this.photos.set(inspection.photos || []);
        this.existingSignature = inspection.signatureUrl;
        this.signatureDataUrl = inspection.signatureUrl;
        this.onDamageToggle();
      }
    });
  }

  onAssetIdChange(): void {
    const assetId = this.inspectionForm.get('assetId')?.value?.trim().toUpperCase();
    if (assetId) {
      const matched = MOCK_ASSETS.find((a) => a.id.toUpperCase() === assetId);
      if (matched) {
        this.inspectionForm.patchValue({
          assetName: matched.name,
          assetCategory: matched.category,
          location: matched.facility,
        });
      }
    }
  }

  onDamageToggle(): void {
    const hasDamage = this.inspectionForm.get('hasDamage')?.value;
    const descControl = this.inspectionForm.get('damageDescription');
    const sevControl = this.inspectionForm.get('severity');

    if (hasDamage) {
      descControl?.setValidators([Validators.required]);
      sevControl?.setValidators([Validators.required]);
    } else {
      descControl?.clearValidators();
      sevControl?.clearValidators();
    }
    descControl?.updateValueAndValidity();
    sevControl?.updateValueAndValidity();
  }

  async openQrScanner(): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: QrScannerModalComponent,
    });
    await modal.present();

    const { data, role } = await modal.onWillDismiss();
    if (role === 'selected' && data?.asset) {
      const asset = data.asset;
      this.inspectionForm.patchValue({
        assetId: asset.id,
        assetName: asset.name,
        assetCategory: asset.category,
        location: asset.facility,
      });
      this.toast.showSuccess(`Selected: ${asset.id}`);
    }
  }

  async capturePhoto(): Promise<void> {
    const photo = await this.camera.capturePhoto();
    if (photo) {
      this.photos.update((arr) => [...arr, photo]);
      this.toast.showSuccess('Photo captured!');
    }
  }

  async selectPhoto(): Promise<void> {
    const photo = await this.camera.selectFromGallery();
    if (photo) {
      this.photos.update((arr) => [...arr, photo]);
      this.toast.showSuccess('Photo attached!');
    }
  }

  async previewPhoto(photo: InspectionPhoto): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: ImagePreviewModalComponent,
      componentProps: {
        photo,
        canDelete: true,
      },
    });
    await modal.present();

    const { data, role } = await modal.onWillDismiss();
    if (role === 'delete' && data?.photoId) {
      this.photos.update((arr) => arr.filter((p) => p.id !== data.photoId));
    }
  }

  removePhoto(event: Event, index: number): void {
    event.stopPropagation();
    this.photos.update((arr) => {
      const copy = [...arr];
      copy.splice(index, 1);
      return copy;
    });
  }

  onSignatureChange(dataUrl: string | null): void {
    this.signatureDataUrl = dataUrl || undefined;
  }

  private buildInspectionModel(): Inspection {
    const val = this.inspectionForm.value;
    const user = this.auth.currentUser();

    return {
      id: this.inspectionId || 'insp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      assetId: val.assetId.trim().toUpperCase(),
      assetName: val.assetName || val.assetId,
      assetCategory: val.assetCategory || 'General',
      location: val.location || 'Site Location',
      inspectionDate: new Date(val.inspectionDate).toISOString(),
      conditionStatus: val.conditionStatus,
      hasDamage: !!val.hasDamage,
      damageDescription: val.hasDamage ? val.damageDescription : undefined,
      severity: val.hasDamage ? val.severity : undefined,
      notes: val.notes,
      photos: this.photos(),
      signatureUrl: this.signatureDataUrl,
      status: 'DRAFT',
      syncStatus: 'DRAFT',
      inspectorId: user?.id || 'emp-101',
      inspectorName: user?.name || 'Field Engineer',
      history: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  saveAsDraft(): void {
    const val = this.inspectionForm.value;
    if (!val.assetId) {
      this.toast.showWarning('Please enter at least an Asset ID to save a draft.');
      return;
    }

    const model = this.buildInspectionModel();
    model.status = 'DRAFT';
    model.syncStatus = 'DRAFT';

    this.repo.saveDraft(model).subscribe(() => {
      this.router.navigate(['/inspections']);
    });
  }

  submitInspection(): void {
    this.inspectionForm.markAllAsTouched();
    this.onDamageToggle();

    if (this.inspectionForm.invalid) {
      this.toast.showError('Please resolve all validation errors before submitting.');
      return;
    }

    const model = this.buildInspectionModel();
    model.status = 'PENDING_APPROVAL';

    this.repo.submit(model).subscribe(() => {
      this.router.navigate(['/inspections']);
    });
  }
}
