"""Chapters 10-17: features, shared components, scenarios, tooling, extension, notes, exercises, glossary."""
from lib import *


def chapter_features(s: Story):
    s.chapter("10", "Feature Pages Walkthrough", "Each screen: purpose, dependencies, state and notable techniques.")
    s.p("All pages are **standalone components with inline templates and styles** (single `.ts` file). They follow the "
        "same recipe: inject services -> hold state in signals -> load in `ngOnInit` / `ionViewWillEnter` -> render.")

    s.h2("10.1 LoginPage  (`/login`)")
    s.bullets([
        "**Form:** reactive `loginForm` with `email` (required + email format) and `password` (required, min length 4). Pre-filled with `alex@fieldservice.com` / `password123` for demo convenience.",
        "**`onSubmit()`:** `auth.login(email)` -> success toast -> navigate `/dashboard`.",
        "**`quickLogin(role)`:** one-tap demo sign-in using `auth.quickSwitchRole(role)`.",
        "**Online chip:** `@if (network.isOnline()) { Online } @else { Offline Capable }` - a signal read directly in the template.",
        "**Ionic bits:** `ion-card`, `ion-input` (floating label), `ion-chip`, `ion-note` for validation text.",
    ])
    s.h2("10.2 DashboardPage  (`/dashboard`, authGuard)")
    s.bullets([
        "**State:** a single private signal `inspectionsSignal`; everything on screen is a `computed` of it - `totalCount`, `approvedCount`, `pendingWorkerCount` (drafts or pending-sync), `pendingApprovalCount`, `recentInspections` (first 4) and `recentActivity` (flattened audit logs sorted newest-first, top 5).",
        "**Loading:** `ngOnInit` and `ionViewWillEnter` both call `loadData()` -> `repo.getAll()`; `ion-refresher` triggers `handleRefresh(event)`.",
        "**Actions:** `switchRole()` (demo swap between Engineer and Supervisor), `logout()`.",
        "**Navigation:** KPI tiles link to `/inspections?filter=APPROVED` etc. using `routerLink` + `queryParams`. A supervisor sees a shortcut to `/approvals`.",
        "**Header:** `<app-sync-badge>` shows connectivity and queue counters on most pages.",
    ])
    s.h2("10.3 InspectionListPage  (`/inspections`)")
    s.bullets([
        "**Features:** search (`ion-searchbar`, 200 ms debounce), status filter (`ion-segment`), infinite scroll paging (`PAGE_SIZE`), pull-to-refresh, FAB to create.",
        "**Derived state:** `filteredInspections` -> `pagedInspections` (slice by `displayedCount`) -> `hasMoreItems`.",
        "**Query params:** `ngOnInit` subscribes to `route.queryParams` and applies `?filter=` coming from the dashboard tiles.",
        "**Row UI:** condition colour bar, damage flag, status badge (via `statusColor` pipe), and a *sync* badge shown only when `syncStatus !== 'SYNCED'`.",
        "**`loadMore(event)`:** increases `displayedCount` after a 300 ms timeout, then `event.target.complete()` to hide the spinner.",
    ])
    s.callout("Important: this page mixes plain fields (`searchQuery`, `selectedFilter`) with `computed()`. "
              "Read Chapter 15, item 8, to see why that matters.", "warn")
    s.h2("10.4 InspectionFormPage  (`/inspections/new` and `/inspections/:id/edit`)")
    s.p("The biggest and most instructive page (~700 lines). It serves **both create and edit** mode.")
    s.table(
        ["Concern", "Implementation"],
        [
            ["Mode detection", "`ngOnInit` subscribes to `route.paramMap`; if `id` exists and is not `'new'` -> `isEditMode = true` and `loadExistingInspection(id)` patches the form with `patchValue`."],
            ["Auto-fill from asset id", "`onAssetIdChange()` looks the typed id up in `MOCK_ASSETS` and patches name, category and location."],
            ["QR scanning", "`openQrScanner()` opens `QrScannerModalComponent` in a modal; returns role `'selected'` with `{asset}`."],
            ["Conditional validation", "`onDamageToggle()` adds/removes `Validators.required` on `damageDescription` and `severity` depending on `hasDamage`; the red box with those fields is shown by `@if (inspectionForm.get('hasDamage')?.value)`."],
            ["Photos", "`photos` is a `signal<InspectionPhoto[]>`. `capturePhoto()` / `selectPhoto()` call `CameraService`; `previewPhoto()` opens `ImagePreviewModal` (can delete); `removePhoto()` uses `splice` on a copy."],
            ["Signature", "`<app-signature-pad>` emits a PNG data URL through `(signatureChange)`; stored in `signatureDataUrl`."],
            ["Model building", "`buildInspectionModel()` merges form values, photos, signature and the current user into an `Inspection` (uppercases `assetId`, ISO date, new id if not editing)."],
            ["Save Draft", "Requires only an asset id -> `repo.saveDraft(model)` -> navigate to `/inspections`."],
            ["Submit", "`markAllAsTouched()` + `onDamageToggle()`; if the form is invalid show an error toast; otherwise `repo.submit(model)` (online / queued, see 9.4) -> navigate to `/inspections`."],
        ],
        [CONTENT_W * 0.22, CONTENT_W * 0.78],
    )
    s.h2("10.5 InspectionDetailsPage  (`/inspections/:id`)")
    s.bullets([
        "Loads one inspection (`repo.getById`) into a signal in both `ngOnInit` (on route param change) and `ionViewWillEnter`.",
        "Shows asset info, condition/damage, photos (tap opens read-only preview modal), signature, review comments and the **audit timeline** built from `history`.",
        "**Contextual footer** (control flow `@if / @else if / @else`): DRAFT -> *Edit & Complete Draft*; supervisor + PENDING_APPROVAL -> *Approve / Reject*; otherwise *Back to list*.",
        "`confirmApprove()` and `openRejectDialog()` use `AlertController`; rejection **requires** non-empty comments (the handler returns `false` to keep the dialog open).",
        "`exportReport()` simply calls `window.print()` (browser print dialog).",
    ])
    s.h2("10.6 ApprovalListPage  (`/approvals`, supervisor only)")
    s.bullets([
        "Segment tabs **Pending** (`PENDING_APPROVAL`) and **Resolved** (APPROVED or REJECTED), each with a count badge.",
        "Cards allow quick *View*, *Approve* (optional notes) and *Reject* (mandatory comment) without opening the details page.",
        "After each action it calls `loadData()` to refresh the list.",
        "Reached via `roleGuard`; an Engineer who types `/approvals` is redirected to the dashboard with an *Access denied* toast.",
    ])


def chapter_shared(s: Story):
    s.chapter("11", "Shared Components & Pipe", "Reusable building blocks in `shared/`.")
    s.h2("11.1 SyncBadgeComponent  (`<app-sync-badge>`)")
    s.bullets([
        "Injects `NetworkService`, `SyncQueueService`, `ActionSheetController`, `ToastService`.",
        "Template: while `syncQueue.isSyncing()` shows a spinner + *Syncing...*; else a coloured *Online/Offline* button with warning badge `pendingCount()` and danger badge `failedCount() !`.",
        "Tap opens an **action sheet**: *Sync Queue Now* (blocked with a warning if offline) and *Simulate Offline Mode (Testing)* / *Disable Simulated Offline*.",
        "Because it is a signal-reading standalone component it can be dropped into any header with a single tag.",
    ])
    s.h2("11.2 SignaturePadComponent  (`<app-signature-pad>`)")
    s.table(
        ["Piece", "How it works"],
        [
            ["Inputs/Outputs", "`@Input() title`, `@Input() existingSignature`, `@Output() signatureChange = new EventEmitter<string | null>()`."],
            ["Canvas access", "`@ViewChild('sigCanvas')` + `ngAfterViewInit()` gets the 2D context and sizes the canvas to its wrapper (height 120 px)."],
            ["Input events", "Mouse (`mousedown/move/up/leave`) and Touch (`touchstart/move/end`) listeners. Touch handlers call `preventDefault()` and compute coordinates from `getBoundingClientRect()`; CSS `touch-action: none` stops page scrolling while signing."],
            ["Drawing", "`startDraw` begins a path (colour `#002b49`, width 2.5, round caps); `draw` adds `lineTo` + `stroke`."],
            ["Output", "On pointer-up `canvas.toDataURL('image/png')` is emitted; `clear()` wipes the canvas and emits `null`."],
            ["Edit mode", "If an `existingSignature` is provided and the user has not redrawn, it is shown as an `<img>` overlay."],
        ],
        [CONTENT_W * 0.22, CONTENT_W * 0.78],
    )
    s.h2("11.3 QrScannerModalComponent")
    s.p("Displays an **animated viewfinder** (CSS keyframes `scanAnim` moves a laser line) and a list of `MOCK_ASSETS`. "
        "Tapping an asset calls `modalCtrl.dismiss({ asset }, 'selected')`. **No real QR decoding happens** - the "
        "viewfinder is a simulation for the demo; integrating a scanner plugin is a suggested exercise.")
    s.h2("11.4 ImagePreviewModalComponent")
    s.p("Receives `photo` and `canDelete` via `componentProps` (they become `@Input`s). Shows the image full-screen with "
        "its timestamp/size, a close button (`dismiss(null,'close')`) and - when `canDelete` is true - a delete button "
        "that dismisses with role `'delete'` and `{ photoId }`.")
    s.h2("11.5 StatusColorPipe  (`{{ value | statusColor:'type' }}`)")
    s.table(
        ["Type", "Value -> Ionic colour"],
        [
            ["`status`", "APPROVED -> success; PENDING_APPROVAL -> warning; REJECTED -> danger; DRAFT -> medium; else primary"],
            ["`sync`", "SYNCED -> success; PENDING_SYNC -> warning; SYNC_FAILED -> danger; DRAFT -> medium"],
            ["`condition`", "GOOD -> success; FAIR -> primary; POOR -> warning; CRITICAL -> danger"],
            ["`severity`", "LOW -> success; MEDIUM -> warning; HIGH / CRITICAL -> danger"],
            ["empty/unknown", "`medium`"],
        ],
        [CONTENT_W * 0.18, CONTENT_W * 0.82],
    )
    s.p("It is a **pure pipe**, so Angular only recomputes it when its inputs change - ideal for badge colours in long lists.")


def chapter_scenarios(s: Story):
    s.chapter("12", "End-to-End Scenarios", "Follow real user journeys through the code, step by step.")
    s.h2("12.1 First launch and sign-in")
    s.numbered([
        "Browser loads `index.html` -> `main.ts` bootstraps -> router sees `''` -> redirect `dashboard`.",
        "`authGuard` injects `AuthService`; no session in `localStorage` -> returns `UrlTree('/login')`.",
        "`LoginPage` is lazy-loaded. User taps **Field Engineer (Alex Carter)** -> `quickLogin('EMPLOYEE')`.",
        "`AuthService.quickSwitchRole` builds a session (fake JWT, +8 h), `persistSession` writes `fia_auth_session` and updates the signal.",
        "`router.navigate(['/dashboard'])`; guard now passes; `DashboardPage` loads; repositories seed demo data.",
    ])
    s.h2("12.2 Create an inspection with damage and submit online")
    s.numbered([
        "Dashboard -> **New Inspection** (`/inspections/new`) -> `InspectionFormPage`.",
        "User types `AST-PUMP-001`; `ionChange` -> `onAssetIdChange()` autofills name/location from `MOCK_ASSETS`.",
        "Selects **Damage Present** -> `onDamageToggle()` makes severity & description required; the orange box appears.",
        "Taps **Take Photo** -> `CameraService.capturePhoto()` -> Capacitor Camera (or web fallback) -> base64 photo pushed into `photos` signal.",
        "Draws a signature -> `signatureChange` -> stored as PNG data URL.",
        "Taps **Submit** -> form valid -> `buildInspectionModel()` -> `repo.submit(model)`.",
        "Online path: audit entry `SUBMITTED`; `remoteRepo.postInspection` (300 ms fake latency) -> saved as `SYNCED` locally; navigate to the list.",
    ])
    s.h2("12.3 Submit while offline, then reconnect")
    s.drawing(vflow([
        ("User enables 'Simulate Offline Mode'", "SyncBadge action sheet -> NetworkService.toggleSimulatedOffline()  =>  isOnline() = false"),
        ("User submits an inspection", "SyncInspectionRepository.submit(): syncStatus = PENDING_SYNC, audit note 'queued for synchronization'"),
        ("Saved locally + queued", "localRepo.save(...)  then  syncQueue.enqueue('SUBMIT', saved)  -> badge shows 1 pending"),
        ("User disables simulation / network returns", "NetworkService emits onStatusChange(true)"),
        ("SyncQueueService reacts automatically", "subscription sees isOnline && pendingCount > 0  ->  processQueue()"),
        ("Queue item uploaded", "remoteRepo.postInspection -> localRepo.save(syncStatus: SYNCED) -> item COMPLETED -> removed"),
        ("User feedback", "Toast 'Synchronized 1 inspection successfully!' and the pending badge disappears"),
    ], box_h=34, gap=11), "Figure 12.1 - The offline round trip, with no user action needed after reconnecting.")
    s.h2("12.4 Supervisor approves or rejects")
    s.numbered([
        "Supervisor signs in (`quickLogin('SUPERVISOR')`) -> dashboard shows a link to **Approvals**.",
        "`/approvals`: `authGuard` OK, `roleGuard` compares `route.data['role']` ('SUPERVISOR') with `auth.userRole()` -> allowed.",
        "`ApprovalListPage.loadData()` -> `repo.getAll()`; the *Pending* tab filters `status === 'PENDING_APPROVAL'`.",
        "**Approve**: AlertController with optional note -> `repo.approve(id, user.id, user.name, note)` -> status APPROVED, audit entry, remote post or queue.",
        "**Reject**: comment is mandatory; empty text shows an error toast and the dialog stays open (handler returns `false`).",
        "The Engineer later sees the new status, review comments and the audit timeline in the details page.",
    ])
    s.h2("12.5 Protection scenarios")
    s.table(
        ["Situation", "What happens", "Code"],
        [
            ["Engineer opens `/approvals`", "Warning toast *Access denied: Requires SUPERVISOR permissions*; redirect to dashboard", "`roleGuard`"],
            ["Signed-out user opens `/dashboard`", "Redirect to `/login`", "`authGuard`"],
            ["Session older than 8 hours", "Persisted session discarded on load; `isAuthenticated()` false; expired toast if detected while running", "`loadPersistedSession`, `handleSessionExpired`"],
            ["Unknown URL like `/foo`", "Wildcard route redirects to dashboard", "`path: '**'`"],
            ["Server call fails while 'online'", "Falls back to queue, warning toast *Network glitch*", "`submit()` `catchError`"],
            ["3 consecutive sync failures", "Queue item `FAILED`, inspection `SYNC_FAILED`, error toast, can `retryItem()`", "`processQueue`"],
        ],
        [CONTENT_W * 0.3, CONTENT_W * 0.45, CONTENT_W * 0.25],
    )


def chapter_tooling(s: Story):
    s.chapter("13", "Tooling, Build & Testing", "How the project is compiled, run, linted and tested.")
    s.h2("13.1 npm scripts")
    s.table(
        ["Command", "Runs", "Result"],
        [
            ["`npm start`", "`ng serve`", "Dev server on http://localhost:4200 with hot reload (development configuration)"],
            ["`npm run build`", "`ng build`", "Production build (default configuration) into `www/` with hashed file names"],
            ["`npm run watch`", "`ng build --watch --configuration development`", "Continuous dev build"],
            ["`npm test`", "`ng test`", "Vitest unit tests (watch mode by default; use `--configuration ci` for one-off)"],
            ["`npm run lint`", "`ng lint`", "ESLint over `src/**/*.ts` and `src/**/*.html`"],
        ],
        [CONTENT_W * 0.2, CONTENT_W * 0.33, CONTENT_W * 0.47],
    )
    s.h2("13.2 Build configurations")
    s.bullets([
        "**development:** no optimisation, source maps, named chunks - easy debugging.",
        "**production (default for `build`):** minified, output hashing, **budgets** (initial bundle warning 2 MB / error 5 MB; per-component style 10 kB / 20 kB) and `environment.prod.ts` replaces `environment.ts`.",
        "The builder `@angular/build:application` uses **esbuild + Vite** (fast); lazy routes become separate `chunk-*.js` files.",
    ])
    s.h2("13.3 Unit testing with Vitest")
    s.p("Tests run in **jsdom** (a simulated browser). `src/test-setup.ts` polyfills `window.matchMedia`, which Ionic "
        "components call but jsdom lacks.")
    s.table(
        ["Spec file", "What it verifies"],
        [
            ["`auth.service.spec.ts`", "Login sets role & authentication; `quickSwitchRole('SUPERVISOR')`; logout clears state and navigates to `/login`."],
            ["`sync-inspection.repository.spec.ts`", "Draft saved locally with DRAFT status; **offline submit is queued** (`enqueue('SUBMIT', ...)`, `PENDING_SYNC`); approve & reject set status, comments and audit entries."],
            ["`inspection.adapter.spec.ts`", "DTO -> Domain mapping; Domain -> DTO with full fidelity; Domain <-> local offline entity round trip."],
            ["`status-color.pipe.spec.ts`", "Colour mapping for status/sync/condition/severity."],
            ["`app.component.spec.ts`", "Root component smoke test."],
        ],
        [CONTENT_W * 0.35, CONTENT_W * 0.65],
    )
    s.code("""
beforeEach(() => {
  mockNetwork = { isOnline: vi.fn(() => true) };            // fake NetworkService
  mockSyncQueue = { enqueue: vi.fn() };                     // spy on calls
  TestBed.configureTestingModule({
    providers: [
      SyncInspectionRepository,                             // the REAL class under test
      { provide: NetworkService, useValue: mockNetwork },   // swapped by DI
      { provide: SyncQueueService, useValue: mockSyncQueue },
      /* ... local/remote/toast mocks ... */
    ],
  });
  repo = TestBed.inject(SyncInspectionRepository);
});

it('should queue inspection when submitting offline', async () => {
  mockNetwork.isOnline.mockReturnValue(false);
  const submitted = await firstValueFrom(repo.submit(testInspection));
  expect(submitted.syncStatus).toBe('PENDING_SYNC');
  expect(mockSyncQueue.enqueue).toHaveBeenCalledWith('SUBMIT', expect.any(Object));
});
""", "Pattern: dependency injection makes the offline logic testable")
    s.h2("13.4 Debugging tips")
    s.bullets([
        "**DevTools -> Application -> Local Storage:** inspect/edit the four `fia_*` keys to see data and the queue live.",
        "**DevTools -> Network -> Offline** or the app's *Simulate Offline* switch to test sync.",
        "**Device toolbar (Ctrl+Shift+M):** emulate a phone to see mobile layout and touch events.",
        "**Console:** the app logs `Online submission failed, falling back to offline queue` and camera fallback warnings.",
        "**Android:** `chrome://inspect` to debug the WebView of a connected device. **iOS:** Safari Web Inspector.",
    ])


def chapter_extend(s: Story):
    s.chapter("14", "How to Extend the App", "Practical recipes once you understand the structure.")
    s.h2("14.1 Add a new page")
    s.numbered([
        "Generate: `npx ng generate @ionic/angular-toolkit:page features/assets/asset-list` (schematics configured for standalone + scss).",
        "Add a route in `app.routes.ts` with `loadComponent` and `canActivate: [authGuard]`.",
        "Inject `SyncInspectionRepository` or a new service with `inject()`; keep state in signals.",
        "Import only the `Ion*` components you use in the component's `imports` array and register icons with `addIcons`.",
    ])
    s.h2("14.2 Replace localStorage with a real database")
    s.p("Only `LocalInspectionRepository` touches storage. Keep its public methods but switch the internals to "
        "`@capacitor/preferences` (small data) or a SQLite plugin / filesystem (inspections + photos). The adapter's "
        "`InspectionLocalEntity { id, data, syncStatus, updatedAt }` already looks like a database row.")
    s.h2("14.3 Connect a real backend")
    s.numbered([
        "Add `provideHttpClient()` to `main.ts` providers.",
        "In `RemoteInspectionRepository` replace the `readDtos/writeDtos` + `delay` simulation with `HttpClient` GET/POST/DELETE calls returning `InspectionApiDto`s; keep using `InspectionAdapter`.",
        "Replace `AuthService.login` with a real `POST /login`, store the JWT and attach it with an HTTP interceptor.",
        "Handle conflicts (e.g. compare `updatedAt` or use ETags) - the current merge simply prefers server copies of SYNCED items.",
    ])
    s.h2("14.4 Add native capabilities")
    s.table(
        ["Feature", "Capacitor option", "Hint"],
        [
            ["Real QR scanning", "A barcode-scanner plugin", "Replace the simulated viewfinder in `QrScannerModalComponent`; keep `dismiss({asset}, 'selected')`"],
            ["GPS tag on inspections", "`@capacitor/geolocation`", "The model/adapter already support `gpsLocation`; set it in `buildInspectionModel()`"],
            ["Tactile feedback", "`@capacitor/haptics` (already installed)", "Call `Haptics.impact()` on submit/approve"],
            ["Status bar / keyboard polish", "`status-bar`, `keyboard` (installed)", "Configure on `Platform.ready()`"],
            ["Survive app kill/restart state", "`@capacitor/preferences` (installed)", "See 14.2"],
        ],
        [CONTENT_W * 0.25, CONTENT_W * 0.33, CONTENT_W * 0.42],
    )


def chapter_notes(s: Story):
    s.chapter("15", "Honest Notes & Known Limitations", "Things the code does differently from what you might assume - useful when learning or presenting this POC.")
    s.p("These observations come from reading the source. Items marked **(code-read)** were verified by reading the "
        "logic and framework semantics; they were **not** executed in a running app for this guide.")
    s.numbered([
        "**README vs code - persistence.** The README mentions SQLite/LocalStorage and `@capacitor/preferences`. The code uses **only `localStorage`**; Preferences is installed but never imported.",
        "**No native projects yet.** There is no `android/` or `ios/` folder; only `capacitor.config.ts`. Camera/Network native behaviour is therefore untested here, and the browser fallbacks are what you see.",
        "**Mock authentication.** `login()` ignores the password and accepts any email (unknown emails become ad-hoc Employees). Tokens are random strings; there is no server verification.",
        "**Simulated backend.** `RemoteInspectionRepository` is another `localStorage` key plus `delay()`. Client and \"server\" share the same browser storage, so real concurrency conflicts cannot occur.",
        "**Simulated QR scanner.** It shows a decorative viewfinder and a pick-list; it never decodes a QR code.",
        "**GPS is modelled but never captured.** `gpsLocation` exists in the model and adapter, but the form does not set it (the `location-outline` icon is imported but unused).",
        "**Storage size.** Photos and signatures are stored as base64 strings inside JSON in `localStorage` (~5 MB quota) - and each queued item stores a **second** copy of the whole inspection.",
        "**Signals + plain fields (code-read).** `InspectionListPage.filteredInspections` is a `computed()` that reads `this.searchQuery` and `this.selectedFilter`, which are ordinary properties. A `computed()` only recomputes when a *signal it read* changes, so typing in the search box or switching the segment does not by itself invalidate it (`onSearchChange` merely sets `displayedCount` to the value it may already have). `ApprovalListPage.displayedInspections` has the same pattern with `activeTab`. The list will refresh when the data signal changes (e.g. pull-to-refresh or re-entering the page). Fix: make these fields signals.",
        "**Manual counters.** `pendingCount` / `failedCount` in `SyncQueueService` are plain writable signals updated by hand; they could simply be `computed()` from `queue()`.",
        "**Simple retry.** Retries happen immediately in one pass (max 3) with no back-off delay.",
        "**Route input binding unused.** `withComponentInputBinding()` is enabled but pages read `ActivatedRoute` directly - both approaches work.",
        "**Client-side authorisation only.** Guards hide screens but real authorisation must live on the server.",
    ])
    s.code("""
// Fix for item 8 - make the filter inputs signals so computed() can track them
public searchQuery   = signal('');
public selectedFilter = signal('ALL');

public readonly filteredInspections = computed(() => {
  let list = this.allInspectionsSignal();
  const q = this.searchQuery().trim().toLowerCase();         // <- now tracked
  if (this.selectedFilter() !== 'ALL') list = list.filter(i => i.status === this.selectedFilter());
  ...
});
// template:  <ion-searchbar [ngModel]="searchQuery()" (ngModelChange)="searchQuery.set($event)">
""", "Suggested fix (not applied - the codebase was left unchanged)")


def chapter_exercises(s: Story):
    s.chapter("16", "Learning Path, Exercises & Cheat Sheet", "Turn reading into skill.")
    s.h2("16.1 Suggested learning path")
    s.table(
        ["Step", "Do this", "You will learn"],
        [
            ["1", "Run `npm start`, sign in as both roles, create & approve an inspection", "The product flow"],
            ["2", "Put a breakpoint in `main.ts`, then in `DashboardPage.loadData()`", "Startup order and DI cascade"],
            ["3", "Toggle *Simulate Offline*, submit, watch `fia_sync_queue` in DevTools, go online", "Offline-first engine"],
            ["4", "Read `SyncInspectionRepository` next to its spec file", "RxJS + testing together"],
            ["5", "Rebuild a small page from scratch (e.g. an Asset list)", "Ionic + standalone Angular"],
            ["6", "Add Android with Capacitor and test the real camera", "Capacitor workflow"],
        ],
        [CONTENT_W * 0.08, CONTENT_W * 0.57, CONTENT_W * 0.35],
    )
    s.h2("16.2 Exercises (with hints)")
    s.table(
        ["#", "Exercise", "Hint"],
        [
            ["1", "Fix the list filter/search so it updates instantly", "Convert `searchQuery`, `selectedFilter` (and Approvals' `activeTab`) to signals - see 15.8"],
            ["2", "Add a *Delete draft* button on the details page", "`repo.delete(id)` exists; show an `AlertController` confirmation; navigate back"],
            ["3", "Show queued items in a *Sync Manager* page", "`SyncQueueService.queue()` is a signal; use `retryItem(id)`"],
            ["4", "Add exponential back-off to sync retries", "Use `setTimeout` or RxJS `retry({ delay })` in `processQueue`"],
            ["5", "Store inspections with `@capacitor/preferences`", "Only change `LocalInspectionRepository` internals; keep the adapter"],
            ["6", "Capture GPS when starting an inspection", "Install `@capacitor/geolocation`; set `gpsLocation` in `buildInspectionModel()`"],
            ["7", "Write a spec for `SyncQueueService`", "Mock `NetworkService.onStatusChange` with a `Subject` and assert `processQueue` is called"],
            ["8", "Add haptic feedback on approve/reject", "`import { Haptics } from '@capacitor/haptics'` (already installed)"],
        ],
        [CONTENT_W * 0.06, CONTENT_W * 0.47, CONTENT_W * 0.47],
    )
    s.h2("16.3 \"Where do I find...?\" cheat sheet")
    s.table(
        ["I want to know...", "Open this"],
        [
            ["Where the app starts", "`src/index.html` -> `src/main.ts`"],
            ["Which URL shows which page / guards", "`src/app/app.routes.ts`"],
            ["How login state is kept", "`core/auth/auth.service.ts` (`fia_auth_session`)"],
            ["How online/offline is detected", "`core/services/network.service.ts`"],
            ["How a submit decides online vs queue", "`core/repositories/sync-inspection.repository.ts` -> `submit()`"],
            ["How the queue retries and syncs", "`core/sync/sync-queue.service.ts`"],
            ["How server data is mapped", "`core/repositories/inspection.adapter.ts`"],
            ["How photos are taken", "`core/services/camera.service.ts`"],
            ["Brand colours / dark mode", "`src/theme/variables.scss`, `src/global.scss`"],
            ["App id / native config", "`capacitor.config.ts`"],
            ["Build output folder and options", "`angular.json` (`outputPath.base: www`)"],
        ],
        [CONTENT_W * 0.42, CONTENT_W * 0.58],
    )


def chapter_glossary(s: Story):
    s.chapter("17", "Glossary", "Plain-language definitions of the terms used in this guide.")
    s.table(
        ["Term", "Meaning"],
        [
            ["**Angular**", "Google's TypeScript framework for building web apps (components, DI, routing, forms)."],
            ["**Standalone component**", "A component that declares its own dependencies; no `NgModule` required."],
            ["**Bootstrap**", "Starting Angular and attaching the root component to the page."],
            ["**Dependency Injection**", "Framework supplies the objects a class needs instead of the class creating them."],
            ["**Signal**", "Reactive value container; reading it inside templates/computed creates automatic dependencies."],
            ["**computed()**", "A read-only signal derived from other signals, cached until they change."],
            ["**Observable / RxJS**", "Stream of values over time; lazy until subscribed."],
            ["**Lazy loading**", "Downloading a feature's code only when first needed (`loadComponent`)."],
            ["**Guard**", "Function that allows, blocks or redirects a navigation."],
            ["**Pipe**", "Template helper that transforms a value (`| statusColor`)."],
            ["**Ionic**", "UI component library and navigation layer for mobile-style web apps."],
            ["**Web component / custom element**", "Browser-native reusable HTML tag such as `<ion-button>`."],
            ["**Slot**", "Named placeholder inside a web component where you put child content."],
            ["**Overlay controller**", "Service that creates toasts, alerts, modals or action sheets in code."],
            ["**Capacitor**", "Native runtime that wraps a web app in a WebView and exposes device APIs via plugins."],
            ["**Plugin**", "A package bridging JavaScript to native device features (Camera, Network)."],
            ["**WebView**", "Embedded browser inside a native app that renders the web UI."],
            ["**PWA Elements**", "Web fallbacks for native UIs (camera modal) when running in a browser."],
            ["**Repository pattern**", "Abstraction hiding where data is stored/fetched behind a simple interface."],
            ["**Adapter pattern**", "Class that converts one data shape into another so layers stay decoupled."],
            ["**DTO**", "Data Transfer Object - the shape used on the wire to the server."],
            ["**Offline-first**", "Design where the local device copy is primary; the network is used opportunistically."],
            ["**Sync queue**", "Persistent list of operations done offline, replayed when online."],
            ["**Audit trail**", "Chronological record of who did what and when (`history[]`)."],
            ["**Data URL / base64**", "Binary data encoded as text: `data:image/png;base64,...`."],
            ["**Vitest / TestBed**", "Test runner / Angular's utility for configuring DI in tests."],
            ["**Zoneless**", "Angular running without zone.js, relying on signals/events to refresh the UI."],
        ],
        [CONTENT_W * 0.27, CONTENT_W * 0.73],
    )
    s.space(10)
    s.callout("You now have the full map: **index.html -> main.ts -> AppComponent -> router -> guarded lazy page -> "
              "repository -> (local | remote | queue) -> storage / Capacitor plugin**. Pick any user action in the "
              "app and you should be able to trace it along that path.", "key", "THE WHOLE APP IN ONE LINE")
