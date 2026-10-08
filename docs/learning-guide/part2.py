"""Chapters 5-9: Ionic, Capacitor, architecture, domain model, core services."""
from lib import *


def chapter_ionic(s: Story):
    s.chapter("5", "Ionic Framework Concepts", "The UI toolkit that makes a web app look and behave like a native mobile app.")
    s.h2("5.1 What is Ionic?")
    s.p("Ionic is a library of **ready-made mobile UI components** (buttons, lists, cards, modals, tabs, toasts, "
        "action sheets...) plus a **navigation system** that mimics native page stacks. The components are built as "
        "standard **web components** (custom HTML tags prefixed with `ion-`). `@ionic/angular` wraps each one so you "
        "can import it into an Angular standalone component.")
    s.code("""
import { IonButton, IonContent, IonHeader, IonToolbar, IonTitle } from '@ionic/angular';

@Component({
  standalone: true,
  imports: [IonButton, IonContent, IonHeader, IonToolbar, IonTitle],  // import ONLY what you use
  template: `<ion-header><ion-toolbar><ion-title>Hi</ion-title></ion-toolbar></ion-header>
             <ion-content><ion-button>Tap</ion-button></ion-content>`,
})
""", "Ionic components are imported one by one (tree-shakable)")
    s.callout("Ionic **automatically adapts its look** to the platform: Material Design on Android (\"md\" mode) "
              "and iOS styling on iPhones (\"ios\" mode). You write the markup once.", "beginner")
    s.h2("5.2 Anatomy of an Ionic page")
    s.drawing(diagram(
        CONTENT_W, 190,
        boxes=[
            (100, 140, 290, 38, "<ion-header>", "<ion-toolbar> with <ion-buttons slot='start|end'> and <ion-title>", NAVY),
            (100, 52, 290, 80, "<ion-content>", "Scrollable body: cards, lists, forms, refresher, FAB, infinite scroll", TEAL),
            (100, 8, 290, 36, "<ion-footer>", "<ion-toolbar> with the main action buttons (e.g. Save Draft | Submit)", PURPLE),
        ],
        texts=[(0, 160, "Top bar", 8, MUTED, "start", True), (0, 90, "Body", 8, MUTED, "start", True), (0, 26, "Bottom bar", 8, MUTED, "start", True)],
    ), "Figure 5.1 - Every page in the app follows this skeleton (see InspectionFormPage).")
    s.h2("5.3 Ionic components used in this project")
    s.table(
        ["Component", "What it does", "Where used"],
        [
            ["`ion-app`, `ion-router-outlet`", "Root container & page host", "`app.component.html`"],
            ["`ion-header/toolbar/title/buttons`", "Top navigation bar", "All pages"],
            ["`ion-back-button defaultHref`", "Smart back arrow; `defaultHref` is used when there is no history (e.g. deep link)", "List, Form, Details"],
            ["`ion-content`", "Scrollable area with pull-to-refresh/FAB support", "All pages"],
            ["`ion-card*`", "Card container (header, title, content)", "Login, form sections, details"],
            ["`ion-list`, `ion-item`, `ion-label`", "Row-based lists; `button` makes an item tappable", "Inspection lists, QR asset list"],
            ["`ion-input`, `ion-textarea`, `ion-select`, `ion-radio-group`", "Form controls (integrate with Angular forms)", "Login, inspection form"],
            ["`ion-button`, `ion-icon`, `ion-badge`, `ion-chip`, `ion-note`, `ion-spinner`", "Actions, icons, status pills, hints, loading", "Everywhere"],
            ["`ion-segment` + `ion-segment-button`", "Tab-like filter switch", "Inspection list filters; Approvals Pending/Resolved"],
            ["`ion-searchbar`", "Search box with `debounce`", "Inspection list"],
            ["`ion-refresher`", "Pull-to-refresh (`ionRefresh` event, call `event.target.complete()`)", "Dashboard, lists"],
            ["`ion-infinite-scroll`", "Load more on scroll (`ionInfinite`)", "Inspection list (PAGE_SIZE paging)"],
            ["`ion-fab` + `ion-fab-button`", "Floating action button", "New inspection from list"],
            ["`ion-grid/row/col`", "12-column responsive grid (`size`, `size-md`)", "Dashboard metrics, photo grid"],
        ],
        [CONTENT_W * 0.3, CONTENT_W * 0.45, CONTENT_W * 0.25],
    )
    s.h2("5.4 Slots, colours and properties")
    s.bullets([
        "**Slots** place content inside a component: `<ion-icon slot=\"start\">` puts an icon before the button text; `slot=\"icon-only\"` makes a square icon button; `<ion-refresher slot=\"fixed\">` pins it outside scroll content.",
        "**Colour names** such as `color=\"primary\"`, `\"success\"`, `\"warning\"`, `\"danger\"`, `\"medium\"` map to CSS variables defined in `theme/variables.scss` (e.g. `--ion-color-primary: #1a56db`).",
        "**fill / expand / size:** `fill=\"outline\" | \"clear\" | \"solid\"`, `expand=\"block\"` (full width), `size=\"small\"`.",
        "**Component CSS variables:** you can restyle internals without hacking: `--background`, `--border-radius`, `--padding-start`.",
    ])
    s.h2("5.5 Navigation: how Ionic differs from plain Angular")
    s.p("In a normal website, navigating away destroys the old page. In a mobile app you expect to **go back** and "
        "find the previous screen exactly as you left it. Ionic achieves this by keeping pages in a **stack**:")
    s.drawing(diagram(
        CONTENT_W, 100,
        boxes=[
            (0, 30, 100, 40, "Dashboard", "stack[0]", NAVY),
            (130, 30, 100, 40, "Inspection List", "stack[1]", BLUE),
            (260, 30, 100, 40, "Details", "stack[2]", TEAL),
            (390, 30, 100, 40, "Edit form", "stack[3] (top)", PURPLE),
        ],
        arrows=[(100, 50, 130, 50, "push"), (230, 50, 260, 50, "push"), (360, 50, 390, 50, "push"), (440, 28, 440, 6, "back (pop)", RED)],
    ), "Figure 5.2 - Pages below the top stay alive in memory (hidden), so back navigation is instant.")
    s.bullets([
        "`IonicRouteStrategy` (set in `main.ts`) is what enables this.",
        "`routerLink=\"['/inspections', item.id]\"` pushes a page; `<ion-back-button>` pops it.",
        "Hidden pages are **not destroyed**, so their `ngOnInit` does not run again. Ionic fires `ionViewWillEnter` / `ionViewDidEnter` / `ionViewWillLeave` instead - this app uses `ionViewWillEnter` to refresh data.",
        "Page transitions are animated automatically and follow platform conventions.",
    ])
    s.h2("5.6 Overlay controllers (programmatic UI)")
    s.p("Toasts, alerts, action sheets and modals are not placed in HTML. You **inject a controller**, create the "
        "overlay in code and present it.")
    s.table(
        ["Controller", "Used for", "File"],
        [
            ["`ToastController`", "Short messages (success/error/warning/info) at top or bottom", "`ToastService` wraps 4 helpers: `showSuccess/Error/Warning/Info`"],
            ["`AlertController`", "Confirm dialogs with inputs (approve notes, mandatory reject reason)", "Approvals + Details pages"],
            ["`ActionSheetController`", "Bottom menu: *Sync Queue Now*, *Simulate Offline*", "`SyncBadgeComponent`"],
            ["`ModalController`", "Full-screen dialogs hosting a component", "QR scanner, photo preview"],
        ],
        [CONTENT_W * 0.25, CONTENT_W * 0.4, CONTENT_W * 0.35],
    )
    s.code("""
// 1. Open a modal showing a component, pass data in, wait for a result
const modal = await this.modalCtrl.create({
  component: ImagePreviewModalComponent,
  componentProps: { photo, canDelete: true },       // becomes @Input()s of the modal
});
await modal.present();
const { data, role } = await modal.onWillDismiss();   // resolves when it closes
if (role === 'delete' && data?.photoId) { /* remove the photo */ }

// 2. Inside the modal component, close it and return a result
this.modalCtrl.dismiss({ photoId: this.photo.id }, 'delete');   // (data, role)
""", "Modal round-trip (inspection-form -> image preview)")
    s.callout("`role` is a small string label (`'selected'`, `'delete'`, `'cancel'`) the opener uses to decide what "
              "to do. It is a neat way to return *intent* from a modal.", "tip")
    s.h2("5.7 Icons")
    s.p("Icons come from the **ionicons** package. They are **registered** before use, then referenced by kebab-case name:")
    s.code("""
import { addIcons } from 'ionicons';
import { cameraOutline, trashOutline } from 'ionicons/icons';
constructor() { addIcons({ cameraOutline, trashOutline }); }   // register
// template:   <ion-icon name="camera-outline"></ion-icon>      // use
""", "Registering icons keeps the bundle small (only icons you import ship)")
    s.h2("5.8 Theming and global CSS")
    s.table(
        ["File", "What it does"],
        [
            ["`global.scss`", "Imports Ionic's required CSS (`core`, `normalize`, `structure`, `typography`), optional utility classes (`padding`, `flex-utils`, `text-alignment`...) and **`palettes/dark.system.css`** -> dark mode follows the device setting."],
            ["`theme/variables.scss`", "Defines the brand palette: primary `#1a56db`, secondary `#0e7490`, tertiary `#475569`, success `#16a34a`, warning `#d97706`, danger `#dc2626`, medium `#64748b`, light, dark. Each colour has `-rgb`, `-contrast`, `-shade`, `-tint` variants Ionic needs."],
            ["Component `styles: [...]`", "Per-page SCSS written inside the `@Component` decorator (encapsulated)."],
        ],
        [CONTENT_W * 0.25, CONTENT_W * 0.75],
    )
    s.h2("5.9 @ionic/pwa-elements")
    s.p("When Capacitor's Camera plugin runs in a **browser** there is no native camera screen. `@ionic/pwa-elements` "
        "supplies web components (camera capture modal) so the same `Camera.getPhoto()` code still works on desktop. "
        "It is registered once in `main.ts` with `defineCustomElements(window)` and is unnecessary inside a native app.")


def chapter_capacitor(s: Story):
    s.chapter("6", "Capacitor Concepts", "How a web app becomes a real Android/iOS app and talks to device features.")
    s.h2("6.1 What is Capacitor?")
    s.p("Capacitor is a **native runtime**. It creates a native Android/iOS project containing a **WebView** that loads "
        "your built web app (`www/`). A **bridge** lets your JavaScript call native code through **plugins** and get "
        "results back as Promises.")
    s.drawing(diagram(
        CONTENT_W, 215,
        boxes=[
            (0, 160, 150, 44, "Your Angular code", "CameraService.capturePhoto()", NAVY),
            (170, 160, 150, 44, "Plugin JS API", "@capacitor/camera", BLUE),
            (340, 160, 150, 44, "Capacitor bridge", "JSON messages", PURPLE),
            (340, 85, 150, 44, "Native plugin code", "Kotlin/Java  |  Swift", TEAL),
            (340, 10, 150, 44, "Device API", "CameraX / AVFoundation", SLATE),
            (0, 85, 150, 44, "Web fallback", "PWA Elements / <input type=file>", AMBER),
        ],
        arrows=[(150, 182, 170, 182), (320, 182, 340, 182), (415, 160, 415, 129, "native run"), (415, 85, 415, 54),
                (75, 160, 75, 129, "in browser", AMBER, True)],
    ), "Figure 6.1 - Same TypeScript call; Capacitor routes it to the native layer on a phone or to a web fallback in the browser.")
    s.h2("6.2 capacitor.config.ts")
    s.code("""
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.fieldinspector',               // reverse-DNS app identifier (store id)
  appName: 'Field Inspector & Asset Maintenance', // name shown under the home-screen icon
  webDir: 'www'                                   // folder with the built web app
};
export default config;
""", "Only three settings are customised - the minimum")
    s.callout("`webDir: 'www'` matches `angular.json -> outputPath.base: 'www'`. That link is what lets "
              "`npx cap sync` copy the Angular build into the native projects.", "key")
    s.h2("6.3 Plugins: installed vs. actually used")
    s.table(
        ["Package", "Purpose", "Status in code"],
        [
            ["`@capacitor/core`", "Runtime, `registerPlugin`, platform detection", "Dependency of all plugins"],
            ["`@capacitor/camera`", "Take photos / pick from gallery, permissions", "**USED** - `CameraService`"],
            ["`@capacitor/network`", "Current connectivity + change events", "**USED** - `NetworkService`"],
            ["`@capacitor/preferences`", "Native key-value storage (survives better than localStorage)", "Installed, **not imported yet**"],
            ["`@capacitor/app`", "App lifecycle, back button, deep links", "Installed, not used yet"],
            ["`@capacitor/haptics`", "Vibration feedback", "Installed, not used yet"],
            ["`@capacitor/keyboard`", "Keyboard behaviour on mobile", "Installed, not used yet"],
            ["`@capacitor/status-bar`", "Status bar colour/style", "Installed, not used yet"],
            ["`@capacitor/cli`", "`npx cap ...` commands (dev dependency)", "Tooling"],
        ],
        [CONTENT_W * 0.27, CONTENT_W * 0.45, CONTENT_W * 0.28],
    )
    s.h2("6.4 The Camera plugin in this app")
    s.code("""
async capturePhoto(): Promise<InspectionPhoto | null> {
  const ok = await this.checkOrRequestPermissions();        // 1. permissions
  if (!ok) { toast('Camera permission was denied...'); return null; }
  try {
    const photo = await Camera.getPhoto({                   // 2. open camera
      quality: 85, allowEditing: false,
      resultType: CameraResultType.DataUrl,                 //    -> base64 'data:image/jpeg;...'
      source: CameraSource.Camera,  width: 1280,            //    downscale to 1280px wide
    });
    const sizeKb = Math.round((photo.dataUrl.length * 3) / 4 / 1024);   // 3. estimate size
    return { id: 'photo_' + Date.now() + '_' + rand, dataUrl: photo.dataUrl,
             timestamp: new Date().toISOString(), sizeKb };
  } catch (err) {
    if (userCancelled(err)) return null;                    // quiet exit
    return this.pickPhotoFromFilePicker();                  // 4. web fallback
  }
}
""", "core/services/camera.service.ts (condensed)")
    s.bullets([
        "**Permissions:** `Camera.checkPermissions()` then `requestPermissions()`. In a browser these calls may throw, so the `catch` simply **allows continuing**.",
        "**`CameraSource.Camera` vs `CameraSource.Photos`:** camera vs gallery (`selectFromGallery()`).",
        "**`CameraResultType.DataUrl`:** the image arrives as a base64 string, which is easy to store inside the inspection JSON and show with `<img [src]>`.",
        "**Size formula:** base64 text is ~4/3 the size of the binary, hence `length * 3 / 4`.",
        "**Fallback chain:** native camera -> PWA camera modal (browser) -> hidden `<input type=file accept=image/*>` created in code (`pickPhotoFromFilePicker`).",
    ])
    s.h2("6.5 The Network plugin in this app")
    s.code("""
const status = await Network.getStatus();            // { connected: boolean, connectionType }
this.rawOnlineSignal.set(status.connected);

Network.addListener('networkStatusChange', (status) => {   // fires on connect/disconnect
  this.rawOnlineSignal.set(status.connected);
  this.statusChanges$.next(this.isOnline());               // notify RxJS subscribers
});

// "effective" status = real network AND not in demo-simulated offline mode
public readonly isOnline = computed(() => this.rawOnlineSignal() && !this.simulatedOfflineSignal());
""", "core/services/network.service.ts (condensed)")
    s.callout("The **Simulate Offline Mode** toggle (in the Sync Badge action sheet) flips `simulatedOfflineSignal`. "
              "This lets you demo and test offline behaviour on a desktop browser without touching your Wi-Fi.", "tip")
    s.h2("6.6 Build and run on a real device")
    s.code("""
# one-time: add native platforms (their npm packages are not in package.json yet)
npm install @capacitor/android @capacitor/ios
npx cap add android            # creates android/ project
npx cap add ios                # creates ios/ project (macOS + Xcode required)

# every time you change web code
npm run build                  # Angular -> www/
npx cap sync                   # copy www/ + update native plugins

npx cap open android           # open in Android Studio, press Run
npx cap run android -l --external   # live-reload on a connected device
""", "Typical Capacitor workflow")
    s.callout("On **iOS** you must add usage-description strings (e.g. camera and photo-library reasons) to "
              "`Info.plist`, otherwise the OS will block access. On **Android** the plugin declares the permissions "
              "it needs when you sync. Always read the plugin's docs when you add a native platform.", "warn")
    s.h2("6.7 Storage on a device")
    s.p("This POC stores data with the browser's `localStorage` (inside the WebView). That is fine for a demo, but the "
        "OS may clear WebView storage under memory pressure and `localStorage` has a small quota (~5 MB) while photos "
        "are stored as base64. Production apps normally move to **`@capacitor/preferences`** for small settings and "
        "**SQLite / filesystem** for inspections and photos. Because all data access is hidden behind repositories "
        "(Chapter 7), that migration only touches `LocalInspectionRepository`.")


def chapter_architecture(s: Story):
    s.chapter("7", "Architecture & Design Patterns", "Why the code is split into repositories, adapters and a sync queue.")
    s.h2("7.1 Layered view")
    s.drawing(diagram(
        CONTENT_W, 300,
        boxes=[
            (130, 262, 230, 34, "UI Pages (features/*)", "Login, Dashboard, List, Form, Details, Approvals", NAVY),
            (130, 200, 230, 34, "SyncInspectionRepository", "single entry point used by every page", BLUE),
            (385, 200, 105, 34, "NetworkService", "online? signal", PURPLE),
            (0, 118, 150, 40, "LocalInspectionRepository", "offline cache (read/write)", TEAL),
            (170, 118, 150, 40, "SyncQueueService", "pending offline work", AMBER),
            (340, 118, 150, 40, "RemoteInspectionRepository", "pretend backend + latency", TEAL),
            (0, 44, 150, 36, "localStorage", "fia_local_inspections", SLATE),
            (340, 44, 150, 36, "localStorage", "fia_remote_backend_db", SLATE),
            (170, 44, 150, 36, "localStorage", "fia_sync_queue", SLATE),
            (0, 0, 490, 28, "InspectionAdapter  (static mapper: API DTO <-> Domain <-> Local entity)", None, colors.HexColor("#6d28d9")),
        ],
        arrows=[
            (245, 262, 245, 234), (170, 200, 75, 158), (320, 200, 415, 158), (245, 200, 245, 158, "enqueue"),
            (385, 217, 360, 217), (75, 118, 75, 80), (415, 118, 415, 80), (245, 118, 245, 80),
            (320, 138, 340, 138, "flush"), (170, 138, 150, 138, "mark SYNCED"),
        ],
    ), "Figure 7.1 - Runtime architecture. Pages talk ONLY to SyncInspectionRepository.")
    s.h2("7.2 Repository pattern")
    s.p("A **repository** hides *where data lives* behind a clean set of methods. The page asks "
        "\"give me all inspections\" and does not care whether they come from a phone database, a REST API or memory.")
    s.code("""
export interface InspectionRepository {
  getAll(): Observable<Inspection[]>;
  getById(id: string): Observable<Inspection | null>;
  saveDraft(inspection: Inspection): Observable<Inspection>;
  submit(inspection: Inspection): Observable<Inspection>;
  approve(id, supervisorId, supervisorName, comments?): Observable<Inspection>;
  reject(id, supervisorId, supervisorName, comments): Observable<Inspection>;
  delete(id: string): Observable<boolean>;
}
""", "repositories/inspection.repository.ts - the contract")
    s.table(
        ["Class", "Role", "Key methods"],
        [
            ["`SyncInspectionRepository`", "**Implements the contract.** The orchestrator: decides local vs remote vs queue.", "getAll, getById, saveDraft, submit, approve, reject, delete"],
            ["`LocalInspectionRepository`", "Offline cache in `localStorage` (key `fia_local_inspections`); seeds demo data on first run.", "getAll, getById, save, bulkUpsert, delete"],
            ["`RemoteInspectionRepository`", "**Fake backend** in `localStorage` (key `fia_remote_backend_db`). Refuses to work when offline (throws a network error) and adds artificial delay.", "fetchAll, fetchById, postInspection, deleteInspection"],
        ],
        [CONTENT_W * 0.28, CONTENT_W * 0.45, CONTENT_W * 0.27],
    )
    s.callout("Only `SyncInspectionRepository` formally `implements InspectionRepository`. Local and Remote have "
              "their own method names (`save`, `fetchAll`...) because they are *lower-level* building blocks. To use a "
              "real server later, you would replace the internals of `RemoteInspectionRepository` with `HttpClient` "
              "calls - no page changes needed.", "note")
    s.h2("7.3 Adapter pattern")
    s.p("Three different **shapes** of the same data exist. `InspectionAdapter` converts between them so that each "
        "layer can stay clean:")
    s.table(
        ["Shape", "Type", "Style", "Used by"],
        [
            ["Domain (clean)", "`Inspection`", "camelCase, rich types", "Pages, repositories, queue"],
            ["Server DTO", "`InspectionApiDto`", "snake_case (`asset_code`, `workflow_state`, `created_iso`)", "RemoteInspectionRepository"],
            ["Local entity", "`InspectionLocalEntity`", "`{ id, data: JSON string, syncStatus, updatedAt }`", "LocalInspectionRepository"],
        ],
        [CONTENT_W * 0.2, CONTENT_W * 0.22, CONTENT_W * 0.34, CONTENT_W * 0.24],
    )
    s.table(
        ["Domain field", "API DTO field", "Mapping note"],
        [
            ["`assetId`", "`asset_code`", "rename"],
            ["`assetName`", "`asset_title`", "rename"],
            ["`location`", "`facility_location`", "rename"],
            ["`conditionStatus`", "`overall_condition`", "string cast to `ConditionStatus`"],
            ["`hasDamage` / `damageDescription` / `severity`", "`damage_detected` / `damage_details` / `severity_rating`", "boolean coerced with `!!`"],
            ["`photos[]` {id, dataUrl, caption, timestamp}", "`attached_images[]` {photo_id, image_base64, caption, captured_at}", "array `.map`"],
            ["`gpsLocation {latitude, longitude}`", "`geo_coordinates {lat, lng}`", "nested rename"],
            ["`status`", "`workflow_state`", "workflow state"],
            ["`inspectorId/Name`, `supervisorId/Name`", "`auditor_id/name`, `reviewer_id/name`", "different vocabulary"],
            ["`history[]` audit entries", "`audit_log[]` {log_id, logged_at, user_*, event_type, comment}", "array `.map`"],
        ],
        [CONTENT_W * 0.33, CONTENT_W * 0.42, CONTENT_W * 0.25],
    )
    s.callout("Why bother? If the backend team renames `asset_code` tomorrow, **only the adapter changes**. "
              "Every screen continues to use `assetId`. When data comes from the server the adapter also stamps "
              "`syncStatus: 'SYNCED'` automatically.", "key")
    s.h2("7.4 Offline-first strategy")
    s.bullets([
        "**Reads:** always answer instantly from the local cache. If online, refresh from the server in the background and merge (never overwriting items that are still `PENDING_SYNC`).",
        "**Writes:** save locally first. If online try the server; if the server call fails or the device is offline, put the work on the **sync queue**.",
        "**Reconnect:** `SyncQueueService` listens to `NetworkService.onStatusChange` and automatically flushes the queue.",
        "**Visibility:** badges show *Draft / Pending Sync / Synced / Sync Failed* so the user always knows the state of their work.",
    ])


def chapter_domain(s: Story):
    s.chapter("8", "Domain Model & State Machines", "The data shapes and the lifecycles an inspection moves through.")
    s.h2("8.1 The Inspection model")
    s.table(
        ["Group", "Fields", "Notes"],
        [
            ["Identity", "`id`", "`'insp_' + Date.now() + random` for new ones"],
            ["Asset", "`assetId`, `assetName`, `assetCategory`, `location`", "Auto-filled from `MOCK_ASSETS` when the id matches"],
            ["Findings", "`conditionStatus` (GOOD/FAIR/POOR/CRITICAL), `hasDamage`, `damageDescription?`, `severity?` (LOW/MEDIUM/HIGH/CRITICAL), `notes`", "Damage fields mandatory only when `hasDamage` is true"],
            ["Evidence", "`photos[]` (`id`, `dataUrl`, `caption?`, `timestamp`, `sizeKb?`), `signatureUrl?`, `gpsLocation?`", "Images and signature are base64 data URLs"],
            ["Workflow", "`status` (DRAFT / PENDING_APPROVAL / APPROVED / REJECTED)", "Business process state"],
            ["Sync", "`syncStatus` (DRAFT / PENDING_SYNC / SYNC_FAILED / SYNCED), `syncError?`, `lastSyncedAt?`", "Technical delivery state"],
            ["People", "`inspectorId/Name`, `supervisorId/Name?`, `reviewComments?`, `reviewedAt?`", "Who did what"],
            ["Audit", "`history[]` of `{ id, timestamp, actorId, actorName, actorRole, action, notes? }`", "Actions: CREATED, UPDATED, SAVED_DRAFT, SUBMITTED, APPROVED, REJECTED, SYNCED"],
            ["Timestamps", "`createdAt`, `updatedAt`, `inspectionDate`", "ISO strings"],
        ],
        [CONTENT_W * 0.14, CONTENT_W * 0.5, CONTENT_W * 0.36],
    )
    s.callout("There are **two independent status axes**. `status` answers *\"where is this in the review process?\"*; "
              "`syncStatus` answers *\"has this reached the server yet?\"*. An inspection can be `PENDING_APPROVAL` "
              "(business) and `PENDING_SYNC` (technical) at the same time - exactly what happens when you submit offline.", "key")
    s.h2("8.2 Workflow status machine")
    s.drawing(diagram(
        CONTENT_W, 130,
        boxes=[
            (0, 50, 105, 40, "DRAFT", "editable by engineer", SLATE),
            (160, 50, 130, 40, "PENDING_APPROVAL", "waiting for supervisor", AMBER),
            (380, 85, 110, 36, "APPROVED", "terminal", GREEN),
            (380, 10, 110, 36, "REJECTED", "terminal (in UI)", RED),
        ],
        arrows=[(105, 70, 160, 70, "Submit"), (290, 74, 380, 100, "Approve"), (290, 62, 380, 28, "Reject (comment required)")],
        texts=[(0, 20, "Save Draft keeps status = DRAFT", 7.8, MUTED, "start", False)],
    ), "Figure 8.1 - Only DRAFT items show the Edit & Complete Draft button in the details page.")
    s.h2("8.3 Sync status and queue item status")
    s.drawing(diagram(
        CONTENT_W, 150,
        boxes=[
            (0, 100, 100, 36, "DRAFT", "local only", SLATE),
            (140, 100, 110, 36, "PENDING_SYNC", "queued offline", AMBER),
            (290, 100, 90, 36, "SYNCED", "on server", GREEN),
            (140, 30, 110, 36, "SYNC_FAILED", "3 retries failed", RED),
            (0, 30, 100, 36, "Queue: PENDING", None, TEAL),
        ],
        arrows=[(100, 118, 140, 118, "submit offline"), (250, 118, 290, 118, "processQueue ok"),
                (195, 100, 195, 66, "3 failures", RED), (250, 48, 335, 100, "retryItem()", SLATE, True)],
        texts=[(330, 40, "Queue item states:", 8, INK, "start", True), (330, 28, "PENDING -> SYNCING -> COMPLETED", 7.8, MUTED, "start", False),
               (330, 16, "(or FAILED after MAX_RETRY_COUNT = 3)", 7.8, MUTED, "start", False)],
    ), "Figure 8.2 - A successful online submit skips straight to SYNCED.")
    s.h2("8.4 Roles and permissions")
    s.table(
        ["Role", "Demo user", "Can do", "Enforced by"],
        [
            ["`EMPLOYEE` (Field Engineer)", "Alex Carter - `alex@fieldservice.com` (`emp-101`)", "Create/save/submit inspections, photos, signature, view lists", "`authGuard`; UI hides supervisor actions"],
            ["`SUPERVISOR`", "Sarah Jenkins - `sarah@fieldservice.com` (`sup-201`)", "Everything above plus the `/approvals` portal and Approve/Reject buttons", "`roleGuard` (`data: {role:'SUPERVISOR'}`), `auth.isSupervisor()` in templates"],
        ],
        [CONTENT_W * 0.2, CONTENT_W * 0.28, CONTENT_W * 0.28, CONTENT_W * 0.24],
    )
    s.h2("8.5 Seed data")
    s.p("`core/services/mock-data.ts` provides `MOCK_USERS` (2 users), `MOCK_ASSETS` (6 assets: pump, turbine, compressor, "
        "transformer, storage tank, steam manifold) and `INITIAL_INSPECTIONS` (demo inspections with audit history and "
        "SVG placeholder photos). They are written to storage the first time the app runs.")


def chapter_core(s: Story):
    s.chapter("9", "Core Services Deep Dive", "A close reading of each service in `core/`.")
    s.h2("9.1 AuthService (core/auth/auth.service.ts)")
    s.table(
        ["Member", "Behaviour"],
        [
            ["`sessionSignal`", "Private writable signal holding `AuthSession | null` (`token`, `user`, `expiresAt`). Initial value comes from `loadPersistedSession()` - so a page refresh keeps you signed in."],
            ["`currentUser`, `userRole`, `isSupervisor`, `isEmployee`", "`computed()` values derived from the session."],
            ["`isAuthenticated`", "`computed`: session exists **and** `expiresAt > Date.now()` (8-hour session)."],
            ["`login(email, rolePreference?)`", "Looks the email up in `MOCK_USERS`; if not found falls back to first user with the preferred role; if still none creates an **ad-hoc EMPLOYEE**. **The password is never verified** (mock auth). Creates a fake token `jwt_mock_xxx` and persists it."],
            ["`quickSwitchRole(role)`", "Instantly sign in as the demo user for a role (login buttons + dashboard swap icon)."],
            ["`persistSession(s)`", "Writes/removes `localStorage['fia_auth_session']` **and** updates the signal in one place."],
            ["`checkSessionValidity()` / `handleSessionExpired()`", "If expired: clear session, show warning toast, navigate to `/login`. Called from the constructor."],
            ["`logout()`", "Clear session, toast, navigate to `/login`."],
        ],
        [CONTENT_W * 0.3, CONTENT_W * 0.7],
    )
    s.h3("Guards")
    s.code("""
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService), router = inject(Router);
  return auth.isAuthenticated() ? true : router.createUrlTree(['/login']);
};

export const roleGuard: CanActivateFn = (route) => {
  const required = route.data['role'] as UserRole;       // from the route definition
  if (!auth.isAuthenticated()) return router.createUrlTree(['/login']);
  if (required && auth.userRole() !== required) {
    toast.showWarning(`Access denied: Requires ${required} permissions.`);
    return router.createUrlTree(['/dashboard']);
  }
  return true;
};
""", "auth.guard.ts / role.guard.ts (condensed)")
    s.callout("Guards protect **navigation**, not data. In a real system the **server** must also verify the token "
              "and role on every request - client-side checks alone can be bypassed.", "warn", "SECURITY NOTE")
    s.h2("9.2 NetworkService")
    s.bullets([
        "Two signals: **raw** device connectivity (from Capacitor / `navigator.onLine`) and **simulated offline** (demo switch).",
        "`isOnline = raw && !simulated` is the **only** value other code should read.",
        "`onStatusChange` is an RxJS stream that emits the effective status whenever either input changes.",
        "Initialisation: `Network.getStatus()` for the starting value; `Network.addListener('networkStatusChange', ...)` for updates, with browser `online`/`offline` events as a fallback.",
    ])
    s.h2("9.3 ToastService & CameraService")
    s.p("`ToastService` is a thin wrapper over Ionic's `ToastController` with four presets: **success** (green, top), "
        "**error** (red, top, longer), **warning** (amber, top), **info** (grey, bottom). Centralising them gives the "
        "app one consistent look. `CameraService` was covered in section 6.4.")
    s.h2("9.4 SyncInspectionRepository in detail")
    s.h3("getAll() - cache first, refresh in background")
    s.code("""
getAll() {
  return this.localRepo.getAll().pipe(switchMap(localItems => {
    if (this.networkService.isOnline()) {
      this.remoteRepo.fetchAll().pipe(catchError(() => of([]))).subscribe(remoteItems => {
        // merge: replace a local item with the server copy ONLY if the local copy is SYNCED
        // (never overwrite DRAFT / PENDING_SYNC work), add server-only items
        this.localRepo.bulkUpsert(merged).subscribe();
      });
    }
    return of(localItems);          // <- UI gets the instant local answer
  }));
}
""", "Instant UI, eventual consistency")
    s.h3("submit() - three possible paths")
    s.drawing(diagram(
        CONTENT_W, 190,
        boxes=[
            (150, 150, 190, 34, "submit(inspection)", "status = PENDING_APPROVAL", NAVY),
            (0, 80, 150, 44, "A) Online & server OK", "post -> save SYNCED locally", GREEN),
            (170, 80, 150, 44, "B) Online but server fails", "catchError -> PENDING_SYNC", AMBER),
            (340, 80, 150, 44, "C) Offline", "save PENDING_SYNC locally", RED),
            (170, 8, 150, 44, "syncQueue.enqueue('SUBMIT')", "toast: queued for auto-sync", PURPLE),
        ],
        arrows=[(200, 150, 75, 124), (245, 150, 245, 124), (290, 150, 415, 124), (245, 80, 245, 52), (415, 80, 320, 40)],
    ), "Figure 9.1 - Every path first adds an audit entry (`SUBMITTED`) at the front of `history`.")
    s.h3("approve() / reject()")
    s.numbered([
        "`getById(id)` (local first) -> throws `Inspection not found` if missing.",
        "Build `updated` with new `status`, supervisor id/name, `reviewComments`, `reviewedAt`, `syncStatus` (SYNCED if online else PENDING_SYNC).",
        "Prepend an audit entry (`APPROVED` / `REJECTED`) with actor role `SUPERVISOR`.",
        "Online: `remoteRepo.postInspection` then `localRepo.save` and a success/info toast. Offline: save locally, `enqueue('APPROVE' | 'REJECT')` and a warning toast.",
    ])
    s.h3("saveDraft() and delete()")
    s.p("`saveDraft` forces `status` and `syncStatus` to `DRAFT`, adds a `SAVED_DRAFT` audit entry and writes **only locally** "
        "(drafts never leave the device). `delete` removes locally and, if online, also from the server (errors ignored).")
    s.h2("9.5 SyncQueueService")
    s.code("""
enqueue(operation, inspection) {
  // one queue item per inspection: re-enqueueing UPDATES the existing item (dedupe)
  const item = { id, inspectionId: inspection.id, operation, payload: inspection,
                 enqueuedAt: now, retryCount: 0, status: 'PENDING' };
  persistQueue(queue);                          // localStorage['fia_sync_queue'] + signals
  if (this.networkService.isOnline()) this.processQueue();
}

async processQueue() {
  if (isSyncing || !online) return;             // re-entrancy + connectivity guard
  for (const item of queue) {
    item.status = 'SYNCING';
    try {
      const saved = await firstValueFrom(remoteRepo.postInspection(item.payload));
      saved.syncStatus = 'SYNCED';  saved.lastSyncedAt = now;
      await firstValueFrom(localRepo.save(saved));      // local copy flips to SYNCED
      item.status = 'COMPLETED';
    } catch (err) {
      item.retryCount++;
      item.status = item.retryCount >= 3 ? 'FAILED' : 'PENDING';
      if (FAILED) { payload.syncStatus = 'SYNC_FAILED'; localRepo.save(payload); }
    }
  }
  queue = queue.filter(q => q.status !== 'COMPLETED');   // drop finished work
  ...toasts: 'Synchronized N inspections' / 'N items failed to sync. Will retry.'
}
""", "core/sync/sync-queue.service.ts (condensed)")
    s.bullets([
        "**Auto trigger:** the constructor subscribes `networkService.onStatusChange` and calls `processQueue()` when going online with pending items.",
        "**Manual triggers:** *Sync Queue Now* in the Sync Badge sheet; `retryItem(id)` resets the retry counter and re-processes.",
        "**Counters:** `pendingCount` and `failedCount` are plain signals refreshed by `updateCounters()` whenever the queue is persisted - the Sync Badge binds to them.",
        "**Storage:** the full inspection (including base64 photos) is stored inside each queue item.",
    ])
    s.h2("9.6 All persisted keys")
    s.table(
        ["localStorage key", "Owner", "Content"],
        [
            ["`fia_auth_session`", "AuthService", "`{ token, user, expiresAt }`"],
            ["`fia_local_inspections`", "LocalInspectionRepository", "Array of `InspectionLocalEntity` (JSON string per inspection)"],
            ["`fia_remote_backend_db`", "RemoteInspectionRepository", "Array of `InspectionApiDto` - the \"server\""],
            ["`fia_sync_queue`", "SyncQueueService", "Array of `SyncQueueItem`"],
        ],
        [CONTENT_W * 0.28, CONTENT_W * 0.3, CONTENT_W * 0.42],
        mono_first=True,
    )
    s.callout("To **reset the demo to factory state**, open the browser DevTools -> Application -> Local Storage and "
              "delete these four keys (or run `localStorage.clear()` in the console), then reload.", "tip")
