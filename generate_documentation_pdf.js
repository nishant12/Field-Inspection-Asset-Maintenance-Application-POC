const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const outputPath = path.join(__dirname, 'FieldGuard_Pro_Codebase_Architecture_Guide.pdf');
console.log('Generating documentation PDF at:', outputPath);

const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 50, bottom: 50, left: 50, right: 50 },
  bufferPages: true,
  autoFirstPage: true
});

const writeStream = fs.createWriteStream(outputPath);
doc.pipe(writeStream);

// Palette
const NAVY = '#0f172a';
const BLUE = '#1d4ed8';
const TEAL = '#0e7490';
const DARK_GRAY = '#334155';
const LIGHT_BG = '#f8fafc';
const BORDER_COLOR = '#e2e8f0';
const CODE_BG = '#f1f5f9';
const GREEN = '#15803d';
const AMBER = '#b45309';

// Helpers
function drawHeader(title) {
  doc.save();
  doc.fontSize(9).font('Helvetica-Bold').fillColor(BLUE).text('FIELDGUARD PRO  |  ENTERPRISE ARCHITECTURE GUIDE', 50, 25);
  doc.fontSize(8).font('Helvetica').fillColor(DARK_GRAY).text('ANGULAR 22 + IONIC 9 + CAPACITOR 8', 350, 25, { align: 'right', width: 195 });
  doc.moveTo(50, 38).lineTo(545, 38).strokeColor(BORDER_COLOR).lineWidth(0.75).stroke();
  doc.restore();
}

function checkPageSpace(requiredSpace) {
  if (doc.y + requiredSpace > 780) {
    doc.addPage();
  }
}

function addTitle(title, subtitle) {
  doc.rect(50, doc.y, 495, 110).fillAndStroke('#eff6ff', '#bfdbfe');
  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(22).text(title, 65, doc.y - 95);
  doc.moveDown(0.3);
  doc.fillColor(BLUE).font('Helvetica-Bold').fontSize(12).text(subtitle, 65);
  doc.moveDown(0.2);
  doc.fillColor(DARK_GRAY).font('Helvetica').fontSize(9.5).text('Production-Grade Mobile Architecture, Design Patterns, Lifecycle & Offline Engineering', 65);
  doc.y = 175;
}

function addSection(title) {
  checkPageSpace(60);
  doc.moveDown(1);
  const startY = doc.y;
  doc.rect(50, startY, 4, 20).fill(BLUE);
  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(14).text('  ' + title, 58, startY + 2);
  doc.moveDown(0.6);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor(BORDER_COLOR).lineWidth(0.5).stroke();
  doc.moveDown(0.5);
}

function addSubsection(title) {
  checkPageSpace(45);
  doc.moveDown(0.6);
  doc.fillColor(BLUE).font('Helvetica-Bold').fontSize(11).text(title);
  doc.moveDown(0.3);
}

function addParagraph(text) {
  checkPageSpace(30);
  doc.fillColor(DARK_GRAY).font('Helvetica').fontSize(9.5).lineGap(3).text(text, { align: 'justify' });
  doc.moveDown(0.5);
}

function addBullet(label, text) {
  checkPageSpace(25);
  const indent = 65;
  doc.circle(56, doc.y + 4.5, 2.5).fill(BLUE);
  doc.font('Helvetica-Bold').fontSize(9.5).fillColor(NAVY).text(label + ': ', indent, doc.y, { continued: true });
  doc.font('Helvetica').fontSize(9.5).fillColor(DARK_GRAY).text(text, { align: 'justify' });
  doc.moveDown(0.35);
}

function addCodeBlock(code) {
  checkPageSpace(50);
  doc.moveDown(0.3);
  const textHeight = doc.heightOfString(code, { font: 'Courier', size: 8, width: 475 });
  const blockHeight = textHeight + 14;
  
  if (doc.y + blockHeight > 780) {
    doc.addPage();
  }

  const startY = doc.y;
  doc.rect(50, startY, 495, blockHeight).fillAndStroke(CODE_BG, BORDER_COLOR);
  doc.fillColor('#0f172a').font('Courier').fontSize(8).text(code, 60, startY + 7, { width: 475 });
  doc.y = startY + blockHeight + 6;
}

function addCallout(type, text) {
  checkPageSpace(45);
  doc.moveDown(0.3);
  let bg = '#f0fdf4';
  let border = GREEN;
  let title = 'BEST PRACTICE: ';
  let titleColor = GREEN;

  if (type === 'IMPORTANT') {
    bg = '#fffbeb';
    border = AMBER;
    title = 'KEY ARCHITECTURAL DECISION: ';
    titleColor = AMBER;
  } else if (type === 'INFO') {
    bg = '#eff6ff';
    border = BLUE;
    title = 'NOTE: ';
    titleColor = BLUE;
  }

  const textHeight = doc.heightOfString(text, { font: 'Helvetica', size: 9, width: 460 });
  const boxHeight = textHeight + 16;
  
  if (doc.y + boxHeight > 780) {
    doc.addPage();
  }

  const startY = doc.y;
  doc.rect(50, startY, 495, boxHeight).fill(bg);
  doc.rect(50, startY, 4, boxHeight).fill(border);

  doc.font('Helvetica-Bold').fontSize(9).fillColor(titleColor).text(title, 62, startY + 8, { continued: true });
  doc.font('Helvetica').fontSize(9).fillColor(DARK_GRAY).text(text, { width: 460 });
  doc.y = startY + boxHeight + 6;
}

// -------------------------------------------------------------
// DOCUMENT CONTENT GENERATION
// -------------------------------------------------------------

// Page 1: Header + Section 1 & 2
addTitle('FieldGuard Pro — Architecture Guide', 'Complete Codebase Walkthrough: Angular 22, Ionic 9 & Capacitor 8');

addSection('1. Executive Overview & System Purpose');
addParagraph(
  'FieldGuard Pro is a mobile-first enterprise application built for mission-critical field operations across heavy industries such as Manufacturing, Oil & Gas, Utilities, Construction, Telecom, and Healthcare. Field engineers and inspectors operate in rugged physical facilities where network connectivity is intermittent, slow, or completely absent. The application allows field workers to perform structured inspections, capture photographic evidence, record digital sign-offs, and continue uninterrupted while offline. As soon as connectivity is restored, an automated synchronization queue pushes local mutations to the enterprise backend for supervisor review and audit validation.'
);

addCallout('IMPORTANT', 'The application is architected around offline-first reliability. Local storage is treated as the primary immediate source of truth for UI state, while network requests run through an asynchronous queue with retry policies and state reconciliation.');

addSection('2. Execution Flow & Lifecycle: Where Does the Code Begin?');
addParagraph(
  'Understanding how a modern Angular 22 standalone app boots up and initializes Ionic components is fundamental to navigating this codebase. Below is the precise startup sequence from initial HTML load to rendered views:'
);

addSubsection('Step 2.1: Entry Point HTML (src/index.html)');
addParagraph(
  'Execution begins in index.html. Unlike desktop web apps, mobile apps require specific viewport configurations to account for device notches, dynamic islands, status bars, and rounded device corners:'
);
addCodeBlock(
`<meta name="viewport" content="viewport-fit=cover, width=device-width, 
       initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<app-root></app-root>`
);
addParagraph(
  'The viewport-fit=cover directive signals to iOS WebKit and Android WebView that the app should paint behind status bars and home indicator bars, allowing Ionic CSS variables to inset content cleanly.'
);

addSubsection('Step 2.2: Application Bootstrap (src/main.ts)');
addParagraph(
  'Angular 22 uses the modern standalone bootstrapApplication API instead of legacy AppModule declarations. Here, three foundational runtime systems are configured:'
);
addBullet('PWA Elements Initialization', 'defineCustomElements(window) is invoked from @ionic/pwa-elements/loader. This enables the Capacitor Camera plugin to present an interactive camera interface in web browsers without failing on desktop.');
addBullet('Ionic Angular Standalone Provider', 'provideIonicAngular() registers Ionic web component wrappers, gesture controllers, hardware back-button handlers, and overlay animation controllers.');
addBullet('Router with Component Input Binding', 'provideRouter(routes, withPreloading(PreloadAllModules), withComponentInputBinding()) sets up Angular lazy loading, module preloading for instant mobile performance, and route parameter binding directly into component @Input properties.');
addBullet('IonicRouteStrategy', '{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy } ensures that previously visited mobile views remain cached in the DOM, preserving scroll position and inputs just like a native mobile app.');

addCodeBlock(
`// src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withComponentInputBinding, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular';
import { defineCustomElements } from '@ionic/pwa-elements/loader';

defineCustomElements(window); // Capacitor Camera web support

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules), withComponentInputBinding()),
  ],
});`
);

addSubsection('Step 2.3: Root Shell Component (src/app/app.component.ts)');
addParagraph(
  'The AppComponent serves as the top-level container for the entire mobile viewport. Its template consists of <ion-app><ion-router-outlet></ion-router-outlet></ion-app>. Ionic replaces Angular standard <router-outlet> with <ion-router-outlet>, which coordinates native-feeling page transition animations (slide horizontal on iOS, subtle fade/slide upward on Material Design) and maintains view stacks.'
);

// Section 3: Ionic Concepts
addSection('3. Ionic Framework Concepts Applied');
addParagraph(
  'Ionic Framework provides mobile-optimized web components adhering to iOS Cupertino and Android Material Design design languages. In this application, several core Ionic architectural mechanisms are heavily utilized:'
);

addBullet('Ionic Navigation & View Lifecycle', 'Mobile apps have distinct view lifecycles compared to single-page websites. When navigating to /inspections/new and back, components are not necessarily destroyed. The codebase uses ionViewWillEnter alongside ngOnInit to guarantee fresh inspection data is loaded whenever a user navigates back to the Dashboard or List.');
addBullet('Overlay Controllers', 'Modals (ModalController), action sheets (ActionSheetController), alerts (AlertController), and toasts (ToastController) are managed programmatically via Ionic overlay controllers. Modals display the ImagePreviewModalComponent and QrScannerModalComponent above the page hierarchy.');
addBullet('Interactive Mobile Controls', 'The app incorporates ion-refresher for mobile pull-to-refresh on lists, ion-infinite-scroll for paginated chunk loading (PAGE_SIZE = 8), ion-fab (Floating Action Button) for instant new inspection creation, and ion-segment for segmented tab filtering (All, Pending, Drafts, Approved, Rejected).');
addBullet('Design Token Customization (src/theme/variables.scss)', 'Industrial safety colors (Safety Blue #1a56db, Engineering Teal #0e7490, Emerald Green #16a34a, Hazard Amber #d97706, Safety Red #dc2626) override Ionic default palettes to provide an enterprise-grade utility appearance.');

// Section 4: Capacitor Concepts
addSection('4. Capacitor JS Concepts & Native Plugins');
addParagraph(
  'Capacitor acts as the native runtime and hardware bridge between standard web code and native iOS/Android system APIs. In FieldGuard Pro, Capacitor powers critical field capabilities:'
);

addSubsection('4.1 Capacitor Camera (@capacitor/camera)');
addParagraph(
  'Implemented in CameraService (src/app/core/services/camera.service.ts). The camera integration demonstrates:'
);
addBullet('Permission Negotiation', 'Camera.checkPermissions() and Camera.requestPermissions() proactively check and request system camera and photo library access before capturing.');
addBullet('Dual Input Sources', 'CameraSource.Camera launches the physical device camera viewfinder; CameraSource.Photos launches the system photo picker.');
addBullet('Result Formats & Web Fallback', 'CameraResultType.DataUrl captures JPEG image data directly into base64 data URLs. If the camera app is canceled or the native plugin is unavailable in desktop mode, the service falls back gracefully to a programmatic HTML file input element.');

addSubsection('4.2 Capacitor Network (@capacitor/network)');
addParagraph(
  'Implemented in NetworkService (src/app/core/services/network.service.ts). It monitors live physical interface state via Network.getStatus() and Network.addListener("networkStatusChange", ...). Furthermore, it introduces a Simulated Offline Mode signal that allows QA engineers and supervisors to test offline queueing and recovery on any workstation or browser without disconnecting system Wi-Fi.'
);

addSubsection('4.3 Capacitor Preferences & Persistent Cache');
addParagraph(
  'Used in combination with local storage to retain authentication sessions, offline inspection drafts, and the synchronization queue across application restarts.'
);

// Section 5: Design Patterns
addSection('5. Core Design Patterns: Decoupling & Scalability');
addParagraph(
  'Enterprise software requires clean separation between UI presentation, domain entities, and remote communication layers. This application strictly implements the Repository Pattern and the Adapter Pattern.'
);

addSubsection('5.1 The Adapter Pattern (InspectionAdapter)');
addParagraph(
  'The Adapter Pattern (src/app/core/repositories/inspection.adapter.ts) isolates the internal TypeScript domain model from volatile backend API DTO formats and local storage entity shapes:'
);
addBullet('InspectionApiDto (Remote DTO)', 'Uses snake_case and external names (uuid, asset_code, overall_condition, damage_detected, field_notes, attached_images).');
addBullet('Inspection (Domain Model)', 'Uses clean camelCase typed properties (id, assetId, conditionStatus, hasDamage, notes, photos, history).');
addBullet('InspectionLocalEntity (Offline Storage)', 'Stores serialized entity data, syncStatus flags, and numeric timestamps.');
addParagraph(
  'The InspectionAdapter class provides static methods toDomainFromApi(), toApiDtoFromDomain(), toLocalEntity(), and toDomainFromLocalEntity(). If backend schema changes occur, only the adapter requires maintenance—none of the UI pages or services are affected.'
);

addSubsection('5.2 The Repository Pattern');
addParagraph(
  'The Repository Pattern abstracts data retrieval behind a clear contract interface (InspectionRepository):'
);
addBullet('InspectionRepository (Interface)', 'Defines contracts: getAll(), getById(id), saveDraft(item), submit(item), approve(id, supId, supName, notes), reject(id, supId, supName, notes), delete(id).');
addBullet('LocalInspectionRepository', 'Implements InspectionRepository backed by local storage. Guarantees zero-latency data access even with zero cellular signal.');
addBullet('RemoteInspectionRepository', 'Simulates a remote backend REST API with realistic latency (250-300ms) and checks network connectivity before executing requests.');
addBullet('SyncInspectionRepository (Unified Coordinator)', 'The primary repository injected into UI pages. Implements offline-first logic: always reads from LocalInspectionRepository for immediate rendering, reconciles remote updates in the background, and delegates offline writes to the SyncQueueService.');

// Section 6: Offline Support & Sync Queue
addSection('6. Offline Architecture & The Synchronization Queue');
addParagraph(
  'A core requirement of the application guide is a robust offline queue engine. The lifecycle of an offline inspection proceeds as follows:'
);

addCodeBlock(
`User Fills Inspection Form
         |
    Is Online?
    /         \\
  (Yes)       (No)
   |           |
Submit to   Save locally with status: 'PENDING_SYNC'
Remote API  Enqueue in SyncQueueService ('SUBMIT', inspection)
   |           |
Mark SYNCED  Device regains connection (NetworkService.onStatusChange)
               |
             SyncQueueService.processQueue() runs automatically
               |
             Push to RemoteInspectionRepository -> Mark SYNCED locally`
);

addSubsection('Key Reliability Features in SyncQueueService:');
addBullet('FIFO Execution', 'Queued items are executed sequentially to preserve state chronological ordering.');
addBullet('Retry Policies', 'Each item tracks retryCount. If a sync fails, it is retried up to 3 times before being marked as SYNC_FAILED with an explicit lastError string.');
addBullet('Reactive Automatic Flush', 'SyncQueueService subscribes to NetworkService.onStatusChange. As soon as the network returns, processQueue() executes automatically without requiring user intervention.');
addBullet('Manual Sync Control', 'The SyncBadgeComponent in the navigation bar lets users view the pending queue size, trigger manual sync on demand, or toggle Simulated Offline Mode.');

// Section 7: Security & Roles
addSection('7. Authentication, Roles & Security Guards');
addParagraph(
  'FieldGuard Pro enforces role-based access control (RBAC) across two distinct personas:'
);
addBullet('Field Engineer (Alex Carter)', 'Assigned role EMPLOYEE. Authorized to access the dashboard, browse inspections, create and edit drafts, capture photos, and submit for approval.');
addBullet('Supervisor (Sarah Jenkins)', 'Assigned role SUPERVISOR. Authorized to access the Supervisor Review Portal (/approvals), review submitted inspections, approve or reject with mandatory review comments, and view audit history.');
addBullet('authGuard (src/app/core/auth/auth.guard.ts)', 'Checks AuthService.isAuthenticated(). Redirects unauthenticated visitors to /login.');
addBullet('roleGuard (src/app/core/auth/role.guard.ts)', 'Reads required role from route data (e.g., data: { role: "SUPERVISOR" }). If the current user lacks the required role, access is blocked and they are redirected to /dashboard with an alert.');
addBullet('Session Expiry & Logout Cleanup', 'Sessions expire after 8 hours. On logout, localStorage auth tokens are destroyed, signals reset, and the router navigates back to /login.');

// Section 8: Reactive Forms & Conditional Validation
addSection('8. Advanced Reactive Forms & Conditional Validation');
addParagraph(
  'InspectionFormPage demonstrates complex enterprise form logic utilizing Angular Reactive Forms:'
);
addBullet('Conditional Validation Rules', 'When the user toggles Equipment Damage Detected to "Yes", the damageDescription and severity form controls dynamically receive Validators.required. When toggled back to "No", validators are cleared and value validity updated.');
addBullet('QR Asset Auto-Fill', 'Entering an Asset ID (or tapping the QR Scanner modal to pick a facility asset) automatically populates asset name, category, and facility location.');
addBullet('Digital Sign-Off Canvas', 'The SignaturePadComponent provides a responsive HTML5 touch/mouse drawing canvas that converts physical signatures to PNG base64 strings attached to the inspection.');

// Section 9: Quality & Testing
addSection('9. Testing & Quality Assurance (Vitest)');
addParagraph(
  'The application includes 15 automated unit tests executed via Vitest, verifying core algorithms, transformations, and security barriers:'
);
addBullet('inspection.adapter.spec.ts', 'Verifies full-fidelity bidirectional transformation between remote API DTOs, domain models, and local entities.');
addBullet('sync-inspection.repository.spec.ts', 'Tests offline draft persistence, offline submission queueing, and supervisor approval/rejection audit logging.');
addBullet('auth.service.spec.ts', 'Tests authentication, session persistence, role switching, and logout cleanup.');
addBullet('status-color.pipe.spec.ts', 'Tests status-to-Ionic color token resolution across all workflow, sync, and condition states.');

addCallout('BEST PRACTICE', 'Run "npm test" to run all 15 unit tests. All tests execute in Vitest in ~5 seconds with zero failures.');

// Section 10: Codebase Directory Index
addSection('10. Codebase Structure & File Reference');
addParagraph(
  'Below is the directory map of the implemented application for rapid codebase navigation:'
);

addCodeBlock(
`src/
├── main.ts                                  # Bootstrap entrypoint, PWA elements, Ionic setup
├── index.html                               # Mobile viewport, app-root shell
├── theme/variables.scss                     # Enterprise color palettes & design tokens
├── app/
│   ├── app.routes.ts                        # Route definitions, lazy loading, guards
│   ├── app.component.ts/.html               # Root ion-app & ion-router-outlet shell
│   ├── core/
│   │   ├── auth/                            # AuthService, authGuard, roleGuard, user.model
│   │   ├── repositories/                    # InspectionRepository, Local/Remote/Sync repos, Adapter
│   │   ├── services/                        # NetworkService, CameraService, ToastService, mock-data
│   │   └── sync/                            # SyncQueueService, sync.model
│   ├── shared/
│   │   ├── models/                          # Inspection, Asset, Photo, Audit models
│   │   ├── pipes/                           # StatusColorPipe
│   │   └── components/
│   │       ├── sync-badge/                  # Live connectivity badge & queue action sheet
│   │       ├── image-preview-modal/         # Full-screen photo viewer with metadata
│   │       ├── qr-scanner-modal/            # QR camera viewfinder & asset selector
│   │       └── signature-pad/               # Canvas-based digital sign-off
│   └── features/
│       ├── auth/login/                      # LoginPage with quick demo role switcher
│       ├── dashboard/                       # DashboardPage with KPIs, quick actions, audit feed
│       ├── inspections/                     # InspectionListPage, FormPage, DetailsPage
│       └── approvals/                       # ApprovalListPage for Supervisor review`
);

// Add running headers and footers across all buffered pages
const range = doc.bufferedPageRange();
console.log('Total document pages calculated:', range.count);
for (let i = range.start; i < range.start + range.count; i++) {
  doc.switchToPage(i);
  
  // Header (pages after first page)
  if (i > 0) {
    drawHeader();
  }

  // Footer on all pages
  doc.save();
  doc.moveTo(50, 790).lineTo(545, 790).strokeColor(BORDER_COLOR).lineWidth(0.5).stroke();
  doc.fontSize(8).font('Helvetica').fillColor('#64748b').text(
    'Field Inspection & Asset Maintenance Application  |  POC Architecture Guide',
    50,
    796
  );
  doc.fontSize(8).font('Helvetica-Bold').fillColor(BLUE).text(
    `Page ${i + 1} of ${range.count}`,
    400,
    796,
    { align: 'right', width: 145 }
  );
  doc.restore();
}

// End document
doc.end();

writeStream.on('finish', () => {
  console.log('PDF generation completed successfully!');
  const stats = fs.statSync(outputPath);
  console.log('File size:', stats.size, 'bytes');
});

