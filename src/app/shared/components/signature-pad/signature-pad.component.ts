import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonButton, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { trashOutline, checkmarkOutline } from 'ionicons/icons';

@Component({
  selector: 'app-signature-pad',
  standalone: true,
  imports: [CommonModule, IonButton, IonIcon],
  template: `
    <div class="sig-container">
      <div class="sig-header">
        <span class="sig-title">{{ title }}</span>
        @if (hasDrawn) {
          <ion-button fill="clear" size="small" color="danger" (click)="clear()">
            <ion-icon name="trash-outline" slot="icon-only"></ion-icon>
          </ion-button>
        }
      </div>
      <div class="canvas-wrapper">
        <canvas #sigCanvas></canvas>
        @if (!hasDrawn && !existingSignature) {
          <div class="sig-placeholder">Sign here with finger or mouse</div>
        }
        @if (existingSignature && !hasDrawn) {
          <img [src]="existingSignature" alt="Saved Signature" class="existing-sig" />
        }
      </div>
    </div>
  `,
  styles: [
    `
      .sig-container {
        border: 1px dashed var(--ion-color-step-300, #b0b0b0);
        border-radius: 8px;
        padding: 8px;
        background: var(--ion-card-background, #fff);
      }
      .sig-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 4px;
      }
      .sig-title {
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--ion-color-step-600, #666);
      }
      .canvas-wrapper {
        position: relative;
        height: 120px;
        width: 100%;
        background: #fdfdfd;
        border-radius: 4px;
        overflow: hidden;
      }
      canvas {
        display: block;
        width: 100%;
        height: 100%;
        touch-action: none;
      }
      .sig-placeholder {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        pointer-events: none;
        color: #aaa;
        font-size: 0.85rem;
        font-style: italic;
      }
      .existing-sig {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: contain;
        pointer-events: none;
      }
    `,
  ],
})
export class SignaturePadComponent implements AfterViewInit {
  @Input() title: string = 'Digital Sign-Off';
  @Input() existingSignature?: string;
  @Output() signatureChange = new EventEmitter<string | null>();

  @ViewChild('sigCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  public hasDrawn = false;
  private isDrawing = false;
  private ctx: CanvasRenderingContext2D | null = null;

  constructor() {
    addIcons({ trashOutline, checkmarkOutline });
  }

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d');
    this.resizeCanvas();

    // Mouse listeners
    canvas.addEventListener('mousedown', (e) => this.startDraw(e.offsetX, e.offsetY));
    canvas.addEventListener('mousemove', (e) => this.draw(e.offsetX, e.offsetY));
    canvas.addEventListener('mouseup', () => this.endDraw());
    canvas.addEventListener('mouseleave', () => this.endDraw());

    // Touch listeners
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      this.startDraw(touch.clientX - rect.left, touch.clientY - rect.top);
    });
    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      this.draw(touch.clientX - rect.left, touch.clientY - rect.top);
    });
    canvas.addEventListener('touchend', () => this.endDraw());
  }

  private resizeCanvas(): void {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.parentElement?.getBoundingClientRect();
    if (rect) {
      canvas.width = rect.width;
      canvas.height = 120;
    }
  }

  private startDraw(x: number, y: number): void {
    if (!this.ctx) return;
    this.isDrawing = true;
    this.hasDrawn = true;
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
    this.ctx.strokeStyle = '#002b49';
    this.ctx.lineWidth = 2.5;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
  }

  private draw(x: number, y: number): void {
    if (!this.isDrawing || !this.ctx) return;
    this.ctx.lineTo(x, y);
    this.ctx.stroke();
  }

  private endDraw(): void {
    if (!this.isDrawing) return;
    this.isDrawing = false;
    const dataUrl = this.canvasRef.nativeElement.toDataURL('image/png');
    this.signatureChange.emit(dataUrl);
  }

  public clear(): void {
    if (!this.ctx) return;
    const canvas = this.canvasRef.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.hasDrawn = false;
    this.signatureChange.emit(null);
  }
}
