# Field Inspection & Asset Maintenance Application (FieldGuard Pro)

A mobile-first enterprise application for field employees to conduct asset inspections, capture findings and photos, work completely offline, synchronize data automatically upon network reconnection, and submit inspections for supervisor review and approval.

Built with **Angular (v22 Standalone)**, **Ionic Framework (v9)**, and **Capacitor (v8)**.

---

## Architecture Overview

```text
                           +----------------------------------------+
                           |           Ionic + Angular UI           |
                           |  (Features: Auth, Dashboard, Forms,    |
                           |   Inspection List/Detail, Approvals)   |
                           +----------------------------------------+
                                                |
                                                v
                           +----------------------------------------+
                           |        SyncInspectionRepository        |
                           |       (Unified Repository Pattern)     |
                           +----------------------------------------+
                                        /                \
                                       /                  \
                                      v                    v
+----------------------------------------+       +------------------------------------+
|        LocalInspectionRepository       |       |     RemoteInspectionRepository     |
| (Offline cache, SQLite / LocalStorage) |       | (Mock Backend API with latency/net)|
+----------------------------------------+       +------------------------------------+
                   ^                                       ^
                   |                                       |
                   +----------- [ SyncQueueService ] ------+
                                (Auto-syncs on reconnect)
```

### Key Technical Concepts Demonstrated

1. **Standalone Angular Architecture**: Modern standalone components without `NgModule` overhead.
2. **Feature-Based Project Structure**:
   - `core/`: Authentication, Network monitoring, Repositories, Adapters, Sync queue, and Toast services.
   - `shared/`: Domain models, pipes (`StatusColorPipe`), and reusable components (`SyncBadge`, `ImagePreviewModal`, `QrScannerModal`, `SignaturePad`).
   - `features/`: Feature modules for `auth`, `dashboard`, `inspections`, and `approvals`.
3. **Repository Pattern**:
   - `InspectionRepository` interface defining data contracts.
   - `LocalInspectionRepository` for instant offline reads and entity caching.
   - `RemoteInspectionRepository` simulating remote backend API with network validation.
   - `SyncInspectionRepository` orchestrating offline-first writes, queueing, and conflict reconciliation.
4. **Adapter Pattern**:
   - `InspectionAdapter` decouples external API DTOs (`InspectionApiDto`) and local database entities (`InspectionLocalEntity`) from the clean TypeScript domain model (`Inspection`).
5. **Advanced Reactive Forms & Conditional Validation**:
   - Real-time conditional validation: when equipment damage is flagged, damage description and severity rating become mandatory.
6. **Capacitor Plugins**:
   - `@capacitor/camera` + `@ionic/pwa-elements`: Native and web camera photo capture, gallery picking, permission handling, and preview modal.
   - `@capacitor/network`: Real-time network status tracking.
   - `@capacitor/preferences` & Storage: Offline persistence.
7. **Role-Based Access Control & Guards**:
   - Roles: `EMPLOYEE` (Field Engineer) and `SUPERVISOR`.
   - `authGuard`: Protects private application routes.
   - `roleGuard`: Enforces supervisor-only access to `/approvals`.
   - Session expiry handling and state cleanup on logout.

---

## User Roles & Credentials

The application includes sample demo accounts with quick one-tap login:

| Role | Name | Email | Permissions |
|---|---|---|---|
| **Field Engineer** | Alex Carter | `alex@fieldservice.com` | Create inspections, capture photos, save drafts, submit for approval, sign digitally |
| **Supervisor** | Sarah Jenkins | `sarah@fieldservice.com` | Review pending inspections, approve/reject, add review remarks, audit trail |

---

## Core Application Workflow

1. **Authentication**: Sign in with credentials or click a one-tap Quick Demo Sign-In button.
2. **Dashboard**: View real-time KPI metrics (Total Assigned, Completed, Pending/Drafts, Pending Approval) and recent audit logs.
3. **Create Inspection**:
   - Scan or select asset QR code tag (`AST-PUMP-001`, `AST-TURB-104`, etc.).
   - Set condition rating (Good, Fair, Poor, Critical).
   - If Damage is detected, fill in mandatory severity and damage notes.
   - Capture photos using Capacitor Camera or file picker.
   - Draw digital sign-off signature on the canvas.
   - Save as Draft or Submit for supervisor review.
4. **Offline Mode & Sync Engine**:
   - If offline (or if simulated offline mode is toggled via the Sync Badge in header), submission is stored locally with status `PENDING_SYNC` and queued in `SyncQueueService`.
   - When connection returns, the sync queue automatically flushes, uploads records to the server, and updates status to `SYNCED`.
5. **Supervisor Review**:
   - Supervisor accesses the Review Portal (`/approvals`).
   - Evaluates findings, damage reports, and photos.
   - Approves with optional notes or Rejects with mandatory corrective feedback.

---

## Scripts & Commands

### Development Server
```bash
npm start
```
Starts the Angular + Ionic development server at `http://localhost:4200/`.

### Production Build
```bash
npm run build
```
Generates production-optimized web bundles into the `www/` directory.

### Run Unit Tests
```bash
npm test
```
Executes the Vitest test suite covering repositories, adapters, authentication, and pipes.

---

## End-to-End Manual Test Checklist

Use this checklist to test the application from login through logout. Test the web version for the main workflow, and use an Android emulator or physical device for native camera permissions and device behavior.

### 1. Login and Access Control

- [ ] Sign in as the Field Engineer using the demo sign-in option. Confirm the employee dashboard opens.
- [ ] Sign out, then sign in as the Supervisor. Confirm supervisor access is available.
- [ ] While signed out, directly open `/dashboard`, `/inspections`, and `/approvals`. Confirm protected pages redirect to sign-in.
- [ ] As an employee, directly open `/approvals`. Confirm the employee cannot access the supervisor review area.
- [ ] While signed in, refresh the page and verify session behavior is consistent.
- [ ] Log out, then try to revisit a protected page. Confirm the session is cleared and sign-in is required.

### 2. Dashboard

- [ ] Confirm the dashboard loads without errors.
- [ ] Check that KPI counts (for example, total, completed, drafts, and pending approval) are plausible for the current inspection data.
- [ ] Check recent activity or audit entries, if present.
- [ ] Create, edit, submit, approve, or reject an inspection and verify related counts and activity update as expected.

### 3. Inspection List and Details

- [ ] Open the inspection list and check that assets, conditions, and statuses display correctly.
- [ ] Open an inspection and verify its details.
- [ ] Try any available status filters or search controls.
- [ ] Edit an inspection, save a change, reopen it, and confirm the change persisted.
- [ ] Check the inspection's status and sync indicator.

### 4. Create and Validate an Inspection

- [ ] Create an inspection and select an asset, or use the QR scanner. Try a known tag such as `AST-PUMP-001` if available.
- [ ] Select each condition rating: Good, Fair, Poor, and Critical.
- [ ] With damage unselected, confirm damage-specific fields are not required.
- [ ] With damage selected, try to continue without severity and damage notes. Confirm the required-field validation appears.
- [ ] Enter the required severity and damage description, then continue.
- [ ] Try saving incomplete or invalid data and confirm the form indicates what needs attention.
- [ ] Save the inspection as a draft, reopen it, and verify the entered information remains.

### 5. Photos, QR Scanner, and Signature

These features may behave differently in a browser and on a device.

- [ ] Allow camera access and scan a valid asset QR code. Confirm the intended asset is selected.
- [ ] Deny camera access or cancel scanning and confirm the app handles it clearly.
- [ ] On Android, take a photo and confirm it is attached to the inspection.
- [ ] Choose an existing image from the gallery and confirm it is attached.
- [ ] Open and close the photo preview; confirm you return to the inspection without losing data.
- [ ] Draw a signature, save the inspection, reopen it, and confirm the signature remains.
- [ ] If available, clear or redraw the signature and confirm the updated signature is saved.

Browser camera and file-picker behavior depends on the browser and how the app is served. A browser test does not replace testing native Android permissions and camera behavior.

### 6. Submission and Supervisor Review

- [ ] As an employee, submit a valid inspection for supervisor review.
- [ ] Confirm the inspection has the expected pending/review status.
- [ ] Sign in as the supervisor and open **Approvals**.
- [ ] Open the submitted inspection and review its details, damage report, photos, and signature.
- [ ] Approve one inspection with optional notes. Confirm its status and any audit/history entry update.
- [ ] Try rejecting another inspection without corrective feedback. Confirm feedback is required.
- [ ] Enter corrective feedback and reject the inspection.
- [ ] Sign in as the employee and confirm the rejection and feedback are visible.

### 7. Offline Mode and Synchronization

- [ ] Turn simulated offline mode on using the Sync Badge.
- [ ] Create or submit an inspection and confirm it is stored locally with a pending-sync status, such as `PENDING_SYNC`.
- [ ] Refresh or navigate away and return. Confirm the locally saved inspection remains.
- [ ] Turn simulated offline mode off and wait for synchronization.
- [ ] Confirm the status changes to `SYNCED` and the inspection remains available.

If testing with the device's actual network disabled, treat that as a separate test: simulated offline mode and actual device connectivity may behave differently.

### 8. Complete Workflow and Logout

- [ ] Complete a full employee-to-supervisor flow: create and submit an inspection as an employee, then review and approve it as a supervisor.
- [ ] Log out and confirm protected pages require sign-in again.
- [ ] Repeat the workflow with rejection and corrective feedback to verify that outcome too.

The README describes this project as a proof of concept with a simulated remote backend. Sync and server-side behavior may be simulated rather than connected to a production service. For each test, record the role, inspection status before and after the action, and any error messages.
