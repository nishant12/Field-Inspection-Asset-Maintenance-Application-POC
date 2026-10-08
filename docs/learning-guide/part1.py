"""Chapters 1-4: orientation, anatomy, startup, Angular/TypeScript concepts."""
from lib import *


def chapter_overview(s: Story):
    s.chapter("1", "The Big Picture", "What this app is, which technologies it uses, and how to think about them as layers.")
    s.h2("1.1 What does the app do?")
    s.p("**FieldGuard Pro** is a mobile-first enterprise app for **field engineers** who walk around industrial "
        "sites (pumps, turbines, transformers, tanks...) and inspect equipment. A **supervisor** then reviews what "
        "was found. The key promise of the app is that it keeps working **without internet** and quietly "
        "synchronises when the connection returns.")
    s.table(
        ["Capability", "Where it lives in the code"],
        [
            ["Sign in & roles (Field Engineer / Supervisor)", "`core/auth/` and `features/auth/login/`"],
            ["Dashboard with KPIs and recent activity", "`features/dashboard/dashboard.page.ts`"],
            ["Create / edit inspection with validation", "`features/inspections/inspection-form/`"],
            ["Photos (camera or gallery), signature, QR asset pick", "`core/services/camera.service.ts`, `shared/components/*`"],
            ["Offline-first save + automatic sync", "`core/repositories/*` and `core/sync/*`"],
            ["Supervisor approve / reject with audit trail", "`features/approvals/`, `inspection-details/`"],
        ],
        [CONTENT_W * 0.45, CONTENT_W * 0.55],
    )
    s.h2("1.2 The technology stack as layers")
    s.p("Beginners often mix up Angular, Ionic and Capacitor. They are **three different things stacked on top of "
        "each other**. Learn the job of each layer and the rest of the codebase becomes much easier to read.")
    s.drawing(layers([
        ("Your code  (src/app/**)", "Pages, services, repositories, models you write in TypeScript + HTML + SCSS", NAVY),
        ("Angular 22", "Framework: components, dependency injection, router, forms, signals, RxJS", BLUE),
        ("Ionic 9", "Mobile UI kit: <ion-button>, <ion-list>, modals, page transitions, theming", TEAL),
        ("Capacitor 8", "Native bridge: lets JavaScript call Camera, Network... on Android / iOS", PURPLE),
        ("WebView", "A browser engine embedded inside the native app (Android System WebView / iOS WKWebView)", SLATE),
        ("Android / iOS", "The phone's operating system and hardware (camera, network chip, storage)", colors.HexColor("#334155")),
    ]), "Figure 1.1 - The stack, top (what you write) to bottom (the device).")
    s.callout("Think of it like building a house. **Angular** is the structure and wiring (how things connect), "
              "**Ionic** is the furniture and paint (how it looks and feels like a phone app), and **Capacitor** is "
              "the door to the outside world (the phone's camera, network status, files).", "beginner")
    s.h2("1.3 One app, two ways to run it")
    s.table(
        ["Mode", "How", "What happens"],
        [
            ["**Browser (today)**", "`npm start` -> http://localhost:4200", "Angular+Ionic run in Chrome/Edge. Capacitor plugins fall back to web implementations or to code fallbacks."],
            ["**Native app (next step)**", "`npx cap add android` / `ios`, then `npx cap sync`", "The *same* `www/` build is copied inside a native shell; Capacitor plugins call real native APIs."],
        ],
        [CONTENT_W * 0.2, CONTENT_W * 0.33, CONTENT_W * 0.47],
    )
    s.callout("This repository currently contains **no `android/` or `ios/` folder**, so only the web mode has been "
              "exercised. `capacitor.config.ts` is already in place, so adding a native platform is a one-command step "
              "(see Chapter 6).", "warn", "GOOD TO KNOW")
    s.h2("1.4 Reading order that works")
    s.numbered([
        "Chapters 1-3 give you the mental model and the start-up path (read these first, in order).",
        "Chapters 4-6 are concept references for Angular, Ionic and Capacitor - dip in as needed.",
        "Chapters 7-9 explain the architecture (repositories, adapters, offline sync) - the intellectual core.",
        "Chapters 10-12 walk through each screen and trace complete user journeys step by step.",
        "Chapters 13-17 cover tooling & tests, extension recipes, honest limitations, exercises and a glossary.",
    ])


def chapter_anatomy(s: Story):
    s.chapter("2", "Project Anatomy", "Every folder and config file, and what role it plays.")
    s.h2("2.1 Top-level layout")
    s.code("""
Field Inspection & Asset Maintenance Application POC/
|-- angular.json            <- Angular build/serve/test/lint configuration
|-- capacitor.config.ts     <- Capacitor: appId, appName, webDir ("www")
|-- ionic.config.json       <- Ionic CLI: project type "angular-standalone"
|-- package.json            <- dependencies + npm scripts (start, build, test, lint)
|-- tsconfig*.json          <- TypeScript compiler settings (strict mode ON)
|-- eslint.config.js        <- code-style rules (angular-eslint)
|-- .browserslistrc         <- which browsers the build must support
|-- README.md               <- project summary
|-- www/                    <- OUTPUT of `npm run build` (what Capacitor ships)
|-- node_modules/           <- installed libraries (never edit)
`-- src/                    <- ALL application source code
    |-- index.html          <- the single HTML page (contains <app-root>)
    |-- main.ts             <- JavaScript entry point (bootstraps Angular)
    |-- global.scss         <- global styles + Ionic CSS imports
    |-- theme/variables.scss<- brand colour tokens (--ion-color-*)
    |-- test-setup.ts       <- polyfills for unit tests
    |-- environments/       <- environment.ts / environment.prod.ts
    |-- assets/             <- icons and static files
    `-- app/                <- the application itself (next section)
""", "Folder map")
    s.h2("2.2 Inside src/app (feature-based structure)")
    s.code("""
src/app/
|-- app.component.ts|html   <- root component: <ion-app><ion-router-outlet/></ion-app>
|-- app.routes.ts           <- URL -> page mapping, guards, lazy loading
|
|-- core/                   <- singletons / app-wide logic (no UI pages)
|   |-- auth/               <- AuthService, authGuard, roleGuard, user.model
|   |-- repositories/       <- Inspection repository interface, Local, Remote, Sync,
|   |                          plus InspectionAdapter (DTO <-> domain <-> local entity)
|   |-- services/           <- NetworkService, CameraService, ToastService, mock-data
|   `-- sync/               <- SyncQueueService + sync.model (queue item types)
|
|-- features/               <- one folder per user-facing area (pages)
|   |-- auth/login/         <- LoginPage
|   |-- dashboard/          <- DashboardPage
|   |-- inspections/        <- InspectionListPage, InspectionFormPage, InspectionDetailsPage
|   `-- approvals/          <- ApprovalListPage (supervisor only)
|
`-- shared/                 <- reusable pieces used by several features
    |-- components/         <- SyncBadge, SignaturePad, QrScannerModal, ImagePreviewModal
    |-- models/             <- Inspection, InspectionPhoto, AuditEntry, AssetReference...
    `-- pipes/              <- StatusColorPipe
""", "Feature-based folder structure")
    s.callout("**Rule of thumb:** `core/` = things that exist **once** for the whole app and have no screen. "
              "`features/` = things a user can **navigate to**. `shared/` = small building blocks **reused** by "
              "multiple features. This convention keeps big Angular apps tidy.", "key")
    s.h2("2.3 The configuration files explained")
    s.table(
        ["File", "Purpose (and important lines)"],
        [
            ["`package.json`", "Lists libraries. **Runtime:** @angular/* 22.1.7, @ionic/angular 9, @capacitor/core 8.5.2, camera, network, preferences, app, haptics, keyboard, status-bar, @ionic/pwa-elements, ionicons, rxjs. **Dev:** @angular/cli & build, typescript ~6, vitest, eslint, pdfkit. Scripts: `start` = `ng serve`, `build` = `ng build`, `test` = `ng test`, `lint` = `ng lint`."],
            ["`angular.json`", "Defines project `app`. `build` uses builder `@angular/build:application` with entry `src/main.ts`, index `src/index.html`, output folder **`www`**, styles `global.scss` + `variables.scss`, assets from `src/assets`. `polyfills: []` (no zone.js). `production` config adds size budgets and swaps `environment.ts` with `environment.prod.ts`. `serve` uses the dev-server builder, default configuration `development`. `test` uses `@angular/build:unit-test` with `src/test-setup.ts`."],
            ["`capacitor.config.ts`", "`appId: io.ionic.fieldinspector`, `appName: Field Inspector & Asset Maintenance`, `webDir: www`. Capacitor copies whatever is inside `www/` into the native project."],
            ["`ionic.config.json`", "Tells the Ionic CLI this is an `angular-standalone` project with the Capacitor integration enabled."],
            ["`tsconfig.json`", "`strict: true` (safer types), `target: es2022`, `moduleResolution: bundler`, Angular `strictTemplates: true` (templates are type-checked), `useDefineForClassFields: false` (needed by Angular decorators)."],
            ["`eslint.config.js`", "Lint rules (angular-eslint + typescript-eslint) run by `npm run lint`."],
            ["`environments/*`", "`environment.ts` -> `production: false`; `environment.prod.ts` is substituted at production build time."],
            ["`www/`", "Generated by `ng build`. It is the folder Capacitor reads (`webDir`). You never edit it by hand."],
        ],
        [CONTENT_W * 0.22, CONTENT_W * 0.78],
    )
    s.callout("The folder also contains helper files unrelated to the app itself: `build_comprehensive_guide.py`, "
              "`generate_documentation_pdf.js`, `FieldGuard_Pro_Codebase_Architecture_Guide.pdf`, `dummy.pdf`, "
              "`test_run.pdf`. They are earlier documentation experiments - the running app does not use them.", "note")


def chapter_startup(s: Story):
    s.chapter("3", "Where the Code Begins", "The complete journey from typing `npm start` to seeing the first screen.")
    s.p("This is the single most important chapter for understanding the codebase. Follow the numbered steps and "
        "open each file mentioned - you will see exactly how the application wakes up.")
    s.h2("3.1 The 30-second answer")
    s.callout("**Entry point = `src/main.ts`**, loaded by **`src/index.html`**. `main.ts` calls "
              "`bootstrapApplication(AppComponent, ...)`. `AppComponent` (selector `app-root`) renders "
              "`<ion-app><ion-router-outlet/></ion-app>`. The **router** then reads the URL and decides which page "
              "to show (`app.routes.ts`).", "key", "ANSWER")
    s.h2("3.2 Step-by-step startup sequence")
    s.drawing(vflow([
        ("1. npm start", "package.json -> node ng.js serve -> angular.json (serve -> build:development)"),
        ("2. Browser opens http://localhost:4200", "Dev server returns index.html with injected <script> + <link> tags"),
        ("3. index.html parsed", "<app-root></app-root> is an empty placeholder; <base href='/'> sets URL root"),
        ("4. main.ts executes", "defineCustomElements(window)  then  bootstrapApplication(AppComponent, providers)"),
        ("5. AppComponent created inside <app-root>", "Template: <ion-app><ion-router-outlet/></ion-app>"),
        ("6. Router starts", "URL '' -> redirect 'dashboard' -> authGuard runs"),
        ("7a. Not logged in -> /login", "authGuard returns UrlTree('/login'); LoginPage chunk is lazy-loaded"),
        ("7b. Logged in -> DashboardPage", "Chunk lazy-loaded; constructor injects repository -> services wake up"),
        ("8. Data loads, UI renders", "ngOnInit -> repo.getAll() -> signal.set(list) -> computed counts -> template"),
        ("9. Idle-time preloading", "PreloadAllModules downloads all remaining lazy page chunks in background"),
    ], box_h=33, gap=11), "Figure 3.1 - From `npm start` to the first rendered screen.")
    s.h2("3.3 Reading main.ts line by line")
    s.code("""
import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withComponentInputBinding,
         withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular';
import { defineCustomElements } from '@ionic/pwa-elements/loader';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';

// Register PWA elements for web camera support
defineCustomElements(window);

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules), withComponentInputBinding()),
  ],
});
""", "src/main.ts (19 lines - the whole bootstrap)")
    s.table(
        ["Line / piece", "Meaning"],
        [
            ["`defineCustomElements(window)`", "Registers *web components* from `@ionic/pwa-elements` (e.g. `<pwa-camera-modal>`). When the app runs in a browser (no native camera), Capacitor Camera shows this UI instead. Without this call, taking photos on desktop would fail."],
            ["`bootstrapApplication(AppComponent, ...)`", "The **standalone** way to start Angular - no `AppModule`/`NgModule` needed. Angular creates `AppComponent` and attaches it to `<app-root>`."],
            ["`RouteReuseStrategy -> IonicRouteStrategy`", "Replaces Angular's default so Ionic can keep previous pages alive in a **navigation stack** (like a native app). This is why Ionic pages have lifecycle hooks such as `ionViewWillEnter`."],
            ["`provideIonicAngular()`", "Registers Ionic's services (ModalController, ToastController, AlertController, ActionSheetController, Platform...) and global configuration."],
            ["`provideRouter(routes, ...)`", "Installs the router with our `routes` array. **`withPreloading(PreloadAllModules)`** downloads lazy chunks after start-up. **`withComponentInputBinding()`** lets route params be bound to component `@Input()`s (enabled, available for use)."],
        ],
        [CONTENT_W * 0.33, CONTENT_W * 0.67],
    )
    s.h2("3.4 The root component")
    s.code("""
// app.component.ts
@Component({
  selector: 'app-root',          // matches <app-root> in index.html
  standalone: true,
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],   // only the components its template uses
})
export class AppComponent { constructor() {} }

<!-- app.component.html -->
<ion-app>
  <ion-router-outlet></ion-router-outlet>
</ion-app>
""", "The root component is almost empty on purpose")
    s.bullets([
        "`<ion-app>` is Ionic's root container: it handles safe areas, theming, modals/overlays and hardware back-button behaviour.",
        "`<ion-router-outlet>` is a **placeholder** where the router injects the *current page*. It is Ionic's version of Angular's `<router-outlet>` and adds animated page transitions and the page stack.",
        "There is **no logic** in `AppComponent`. All behaviour is delegated to pages (features) and services (core).",
    ])
    s.h2("3.5 The routing table (app.routes.ts)")
    s.table(
        ["URL path", "Page loaded", "Guards", "Notes"],
        [
            ["`''` (empty)", "redirect -> `dashboard`", "-", "`pathMatch: 'full'` = only the exact empty URL"],
            ["`login`", "LoginPage", "-", "public page"],
            ["`dashboard`", "DashboardPage", "authGuard", "home after login"],
            ["`inspections`", "InspectionListPage", "authGuard", "supports `?filter=` query param"],
            ["`inspections/new`", "InspectionFormPage", "authGuard", "create mode"],
            ["`inspections/:id`", "InspectionDetailsPage", "authGuard", "`:id` = route parameter"],
            ["`inspections/:id/edit`", "InspectionFormPage", "authGuard", "same page, edit mode"],
            ["`approvals`", "ApprovalListPage", "authGuard + roleGuard", "`data: { role: 'SUPERVISOR' }`"],
            ["`**`", "redirect -> `dashboard`", "-", "wildcard = unknown URLs"],
        ],
        [CONTENT_W * 0.2, CONTENT_W * 0.25, CONTENT_W * 0.2, CONTENT_W * 0.35],
    )
    s.callout("Order matters: Angular picks the **first** matching route. `inspections/new` is declared *before* "
              "`inspections/:id`, otherwise the word \"new\" would be captured as an id.", "warn", "WATCH OUT")
    s.code("""
{
  path: 'dashboard',
  loadComponent: () => import('./features/dashboard/dashboard.page')
                         .then((m) => m.DashboardPage),   // LAZY LOADING
  canActivate: [authGuard],                               // GUARD
},
""", "Anatomy of one route")
    s.bullets([
        "**Lazy loading:** `import(...)` is a *dynamic import*. The browser downloads that page's code **only when needed**, keeping the first load small (that is why `www/` contains many `chunk-*.js` files).",
        "**Guard:** `canActivate` runs *before* navigation. If it returns `true` the page opens; if it returns a `UrlTree` the router redirects there instead.",
    ])
    s.h2("3.6 What really wakes up when the Dashboard opens")
    s.p("Angular creates objects **lazily** - a service is only constructed the first time something asks for it "
        "through `inject(...)`. Opening the dashboard therefore triggers a *cascade* of constructions. Understanding "
        "this cascade explains where seeding, listeners and background sync begin:")
    s.drawing(diagram(
        CONTENT_W, 215,
        boxes=[
            (150, 170, 190, 36, "DashboardPage", "inject(AuthService), inject(SyncInspectionRepository)", NAVY),
            (150, 112, 190, 36, "SyncInspectionRepository", "inject x5 (below)", BLUE),
            (0, 40, 110, 40, "LocalInspection\nRepository", "constructor: seedIfEmpty()", TEAL),
            (120, 40, 110, 40, "RemoteInspection\nRepository", "constructor: seed server DB", TEAL),
            (240, 40, 110, 40, "NetworkService", "starts Capacitor listener", PURPLE),
            (360, 40, 132, 40, "SyncQueueService", "subscribes to network changes", AMBER),
            (150, 0, 190, 28, "ToastService -> ToastController", "(Ionic overlay)", SLATE),
        ],
        arrows=[
            (245, 170, 245, 148), (200, 112, 60, 80), (225, 112, 175, 80),
            (265, 112, 295, 80), (300, 112, 420, 80),
        ],
    ), "Figure 3.2 - Dependency cascade created by the first `inject(SyncInspectionRepository)`.")
    s.bullets([
        "`LocalInspectionRepository` seeds **browser storage** with demo inspections if none exist yet.",
        "`RemoteInspectionRepository` seeds a **fake server database** (also in browser storage) with all non-draft demo inspections.",
        "`NetworkService` asks Capacitor for the current connectivity and **starts listening** for changes.",
        "`SyncQueueService` loads any previously queued offline work and subscribes to network changes so it can **auto-sync** the moment you are back online.",
    ])


def chapter_angular(s: Story):
    s.chapter("4", "TypeScript & Angular Concepts", "The language features and framework ideas used throughout the code.")
    s.h2("4.1 TypeScript concepts you will meet")
    s.table(
        ["Concept", "Example from this codebase", "What it means"],
        [
            ["Type alias / union", "`type InspectionStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED'`", "A variable can only hold one of these exact strings. Typos become compile errors."],
            ["Interface", "`interface Inspection { id: string; assetId: string; ... }`", "A *shape* contract for objects; erased at runtime."],
            ["Optional property", "`damageDescription?: string`", "May be `undefined`."],
            ["Generics", "`signal<Inspection[]>([])`, `Observable<Inspection | null>`", "Reusable types parameterised by another type."],
            ["Async / await", "`async capturePhoto(): Promise<InspectionPhoto | null>`", "Write asynchronous code that reads top-to-bottom."],
            ["Static members", "`InspectionAdapter.toDomainFromApi(dto)`", "A function on the class itself, no `new` needed."],
            ["Optional chaining / nullish", "`session?.user ?? null`", "Safe access; fallback when null/undefined."],
            ["Spread operator", "`{ ...inspection, status: 'DRAFT' }`", "Copy an object and override fields (immutability)."],
            ["Definite assignment `!`", "`@ViewChild('sigCanvas') canvasRef!: ElementRef`", "Promise to the compiler it will be set later."],
            ["Dynamic import", "`import('./login.page').then(m => m.LoginPage)`", "Load code on demand (lazy loading)."],
        ],
        [CONTENT_W * 0.18, CONTENT_W * 0.45, CONTENT_W * 0.37],
    )
    s.h2("4.2 Standalone components")
    s.p("Before Angular 14, every component had to be declared in an `NgModule`. A **standalone component** lists "
        "what it needs **itself** in its `imports` array - no module. Every page and shared component here is "
        "`standalone: true`.")
    s.code("""
@Component({
  selector: 'app-sync-badge',          // how you write it in HTML: <app-sync-badge>
  standalone: true,
  imports: [CommonModule, IonBadge, IonButton, IonIcon, IonSpinner],  // dependencies
  template: `...inline HTML...`,       // inline template (these pages use inline ones)
  styles: [`...scoped CSS...`],        // styles apply ONLY to this component
})
export class SyncBadgeComponent { ... }
""", "Typical component header")
    s.callout("A component = **TypeScript class** (data & behaviour) + **template** (HTML) + **styles** (CSS), "
              "tied together by the `@Component` decorator. Angular encapsulates the CSS so styles written in one "
              "page do not leak into another.", "beginner")
    s.h2("4.3 Templates: bindings and the new control flow")
    s.table(
        ["Syntax", "Name", "Example in this project"],
        [
            ["`{{ expr }}`", "Interpolation", "`{{ totalCount() }}` prints a value"],
            ["`[prop]=\"expr\"`", "Property binding", "`[disabled]=\"loginForm.invalid\"`, `[src]=\"photo.dataUrl\"`"],
            ["`(event)=\"fn()\"`", "Event binding", "`(click)=\"quickLogin('EMPLOYEE')\"`, `(ionChange)=\"onDamageToggle()\"`"],
            ["`[(ngModel)]`", "Two-way binding", "`<ion-searchbar [(ngModel)]=\"searchQuery\">`"],
            ["`[formGroup]`, `formControlName`", "Reactive-form binding", "Login & inspection forms"],
            ["`@if (...) { } @else { }`", "Control flow (Angular 17+)", "Show online/offline chip; conditional damage fields"],
            ["`@for (x of list; track x.id)`", "Control flow loop", "Photo grid, inspection list; `track` helps Angular reuse DOM nodes"],
            ["`value | statusColor:'sync'`", "Pipe", "Converts `PENDING_SYNC` into the Ionic colour `warning`"],
        ],
        [CONTENT_W * 0.28, CONTENT_W * 0.24, CONTENT_W * 0.48],
    )
    s.h2("4.4 Dependency Injection (DI)")
    s.p("Instead of a class creating its own helpers (`new AuthService()`), it **asks** Angular for them. Angular "
        "builds the object once, shares it, and hands it over. This project uses the modern function style:")
    s.code("""
@Injectable({ providedIn: 'root' })     // ONE shared instance for the whole app
export class AuthService {
  private router = inject(Router);        // Angular gives us the Router
  private toast  = inject(ToastService);  // ...and our own ToastService
}
""", "inject() + providedIn: 'root'")
    s.bullets([
        "**Singleton:** `providedIn: 'root'` means every class that injects `AuthService` receives the **same** object - so login state is shared everywhere.",
        "**Testability:** in unit tests you swap a real service for a fake: `{ provide: NetworkService, useValue: mockNetwork }` (see `sync-inspection.repository.spec.ts`).",
        "**Constructor-free:** `inject()` works in field initialisers, guards (plain functions) and constructors.",
    ])
    s.h2("4.5 Signals - the reactive state primitive")
    s.p("A **signal** is a box holding a value that **notifies** whoever reads it when it changes. Angular 22 uses "
        "signals to know exactly which parts of the screen need updating.")
    s.table(
        ["API", "Role", "Example"],
        [
            ["`signal(initial)`", "Writable state", "`private sessionSignal = signal<AuthSession | null>(...)`"],
            ["`.set(v)` / `.update(fn)`", "Change it", "`this.photos.update(arr => [...arr, photo])`"],
            ["`signal()` read call", "Read value (note the parentheses!)", "`totalCount()`, `network.isOnline()`"],
            ["`computed(() => ...)`", "Derived read-only value, auto-recalculated & cached", "`isAuthenticated`, `approvedCount`, `filteredInspections`"],
            ["`.asReadonly()`", "Expose without letting others write", "`currentSession = sessionSignal.asReadonly()`"],
        ],
        [CONTENT_W * 0.26, CONTENT_W * 0.32, CONTENT_W * 0.42],
    )
    s.code("""
// DashboardPage - a derived number that updates by itself
private inspectionsSignal = signal<Inspection[]>([]);
public readonly approvedCount = computed(
  () => this.inspectionsSignal().filter(i => i.status === 'APPROVED').length
);
// template:  {{ approvedCount() }}      <- re-renders when inspectionsSignal changes
""", "Signal + computed in practice")
    s.callout("`computed()` only re-runs when a **signal it read** changes. If a `computed` reads a plain class field "
              "(not a signal) that field is invisible to Angular's tracking. Two pages in this repo do exactly that - "
              "see Chapter 15 (\"Honest notes\") for a concrete example worth fixing.", "warn", "IMPORTANT SUBTLETY")
    s.p("**No zone.js:** `angular.json` has `polyfills: []`. The app does not load zone.js, so it relies on signals "
        "and template event handlers to trigger screen updates (zoneless change detection).")
    s.h2("4.6 RxJS Observables")
    s.p("An **Observable** is a stream of values over time (like a promise that can emit many values). Repositories "
        "return `Observable<...>` to look like real HTTP calls so a real backend can be plugged in later.")
    s.table(
        ["Operator / function", "Use in this code"],
        [
            ["`of(value)`", "Wrap an immediate value as an Observable (local reads)."],
            ["`delay(ms)`", "Simulate server latency in `RemoteInspectionRepository` (150-300 ms)."],
            ["`throwError(() => err)`", "Emit an error - used when offline: `Network Error: Device is offline`."],
            ["`switchMap`", "After one Observable emits, continue with another (`localRepo.save` -> `remoteRepo.post`)."],
            ["`map`", "Transform the result (show a toast then return the saved object)."],
            ["`catchError`", "Recover from failures - fall back to offline queue."],
            ["`firstValueFrom`", "Convert an Observable to a Promise so `await` can be used (sync queue)."],
            ["`Subject` / `.asObservable()`", "Manual event stream: `NetworkService.onStatusChange`."],
            ["`.subscribe(cb)`", "Actually *run* the Observable. Nothing happens until someone subscribes!"],
        ],
        [CONTENT_W * 0.3, CONTENT_W * 0.7],
    )
    s.h2("4.7 Component lifecycle hooks")
    s.table(
        ["Hook", "Who provides it", "Used for"],
        [
            ["`ngOnInit()`", "Angular", "First data load (`loadData()`), subscribe to route params."],
            ["`ngAfterViewInit()`", "Angular", "SignaturePad: the `<canvas>` exists now, so attach drawing listeners."],
            ["`ionViewWillEnter()`", "**Ionic**", "Runs **every time** a cached page becomes visible again - refreshes lists after you return from another screen."],
        ],
        [CONTENT_W * 0.25, CONTENT_W * 0.2, CONTENT_W * 0.55],
    )
    s.callout("Because `IonicRouteStrategy` **keeps pages alive** in the stack, `ngOnInit` runs only **once** per page "
              "instance. That is why the dashboard, list and approvals pages also implement `ionViewWillEnter` to "
              "re-read data when you come back.", "key")
    s.h2("4.8 Reactive Forms and conditional validation")
    s.p("The login and inspection pages use **Reactive Forms**: the form's structure and rules live in TypeScript.")
    s.code("""
inspectionForm: FormGroup = this.fb.group({
  assetId:        ['', [Validators.required]],
  inspectionDate: [new Date().toISOString().substring(0, 16), [Validators.required]],
  conditionStatus:['GOOD', [Validators.required]],
  hasDamage:      [false, [Validators.required]],
  damageDescription: [''],            // required ONLY when hasDamage is true
  severity:       ['LOW'],            // required ONLY when hasDamage is true
  notes:          ['', [Validators.required]],
});

onDamageToggle() {                     // called on radio change
  const hasDamage = this.inspectionForm.get('hasDamage')?.value;
  if (hasDamage) { desc.setValidators([Validators.required]); sev.setValidators([Validators.required]); }
  else           { desc.clearValidators();                    sev.clearValidators(); }
  desc.updateValueAndValidity();  sev.updateValueAndValidity();   // re-run the rules
}
""", "Conditional validation (inspection-form.page.ts)")
    s.bullets([
        "`FormBuilder.group({...})` builds a `FormGroup` of `FormControl`s (initial value + validators).",
        "In the template `[formGroup]=\"inspectionForm\"` and `formControlName=\"assetId\"` connect inputs to controls.",
        "`markAllAsTouched()` before submit makes every error message appear even if the user never visited the field.",
    ])
    s.h2("4.9 Guards, pipes, @Input/@Output, @ViewChild")
    s.table(
        ["Feature", "Where", "Explanation"],
        [
            ["Functional guard `CanActivateFn`", "`auth.guard.ts`, `role.guard.ts`", "A plain function using `inject()`. Returns `true` or a `UrlTree` redirect. `roleGuard` reads `route.data['role']`."],
            ["Pure pipe", "`StatusColorPipe`", "Transforms a value in the template; reusable & pure (same input -> same output)."],
            ["`@Input()`", "`SignaturePad.title`, `.existingSignature`", "Parent passes data **down**: `[existingSignature]=\"existingSignature\"`."],
            ["`@Output()` + `EventEmitter`", "`SignaturePad.signatureChange`", "Child sends events **up**: `(signatureChange)=\"onSignatureChange($event)\"`."],
            ["`@ViewChild('sigCanvas')`", "`SignaturePad`", "Grab a reference to the `<canvas #sigCanvas>` element to draw on it."],
        ],
        [CONTENT_W * 0.26, CONTENT_W * 0.3, CONTENT_W * 0.44],
    )
