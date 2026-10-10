# Architecture and implementation status

## System boundary

```text
Browser ──┐
          ├── authenticated API / server actions ── one new backend ── one new empty database
Flutter ──┘
```

The Next.js app is intended to host the web experience and the product's only backend. Flutter calls that backend. Begin with one deployable application and one database; extract a separate service only when operating it independently has a concrete benefit.

The new product has its own database, credentials, users, and content. There is no data migration or shared production database with either reference project.

## Module ownership

| Area | Owns | Server-side boundary |
|---|---|---|
| Identity and access | Accounts, sessions, roles, permissions | Every protected action checks the current account and permission on the backend. |
| Course catalog | Course details, topics, lessons, publication | Only published and sellable offers appear to buyers. |
| Commerce | Offers, coupons, checkout, orders, payment events, refunds | Prices are recalculated on the server; verified, repeat-safe payment events drive order state. |
| Learning | Enrollments, course access, progress | An interface or client token alone never grants course access. |
| Video playback | Web and Flutter player behavior and required playback services | Preserve the source implementation; keep platform-specific fixes localized. |
| Manager workspace | User/course/offer/discount/order workflows | The UI and APIs use the same authorization and domain rules. |

## Confirmed role rules

| Role | Scope | Allowed | Restricted |
|---|---|---|---|
| **SUPER_MANAGER** | Whole platform | Full powers; can create any role | Cannot create another SUPER_MANAGER |
| **MANAGER** | Whole platform | Broad operational powers; can create and manage roles below SUPER_MANAGER | Cannot manage SUPER_MANAGER accounts/role or change global security/payment-provider settings |
| **ADMIN** | Explicitly assigned courses | Manage assigned courses | No access to unassigned courses, global accounts, or platform settings |
| **INSTRUCTOR** | Assigned courses | Instructor panel; mostly read-only course access | No course-management edits by default |
| **STUDENT** | Courses with active enrollment | Read course content | No management access; the app may save the student's own playback progress automatically |

Roles remain strings so new roles can be introduced without scattering enum checks through the app. Authorization must stay centralized and enforced on the backend. Course-staff assignments scope ADMIN and INSTRUCTOR access; students are scoped by active enrollment. Unknown role names receive no access by default.

The schema and playback endpoints enforce those course scopes. The quiz API foundation also uses these shared course checks. Course-management screens and mutation APIs, role creation/assignment workflows, and the full permission matrix still need implementation.

## Current code locations

```text
apps/web/src/app/                         # Page shell and API handlers
apps/web/src/features/learning/video-player/ # Preserved web player widgets
apps/web/src/lib/auth.ts                  # Session verification and enrollment helper
apps/web/src/lib/db.ts                    # Prisma client boundary
apps/web/src/lib/drive.ts                 # Server-side Google Drive adapter
apps/web/prisma/schema.prisma             # New-product model foundation
apps/mobile/lib/shared/widgets/drive/     # Preserved Flutter Drive player
apps/mobile/lib/shared/widgets/youtube/   # Preserved Flutter YouTube player
apps/mobile/lib/core/                     # Player session/download support
```

As the product grows, put new account, catalog, commerce, and learning code in feature-owned folders rather than adding unrelated helpers to a global shared directory.

## Video preservation

The web player widgets and three Flutter player Dart files are copied byte-for-byte from the Teaching LMS. Keep the web files under `features/learning/video-player/`; keep Drive and YouTube Flutter widgets in their separate folders. Their support APIs and dependencies are documented in [Video playback support map](VIDEO_PLAYBACK.md).

A player file can be changed only when a playback requirement calls for it. Keep the current implementation intact while building the new shell and backend around it.

## Security and data boundaries

- Use a dedicated empty database and fresh development, test, and production secrets.
- Keep Google and payment credentials server-side. Mobile configuration contains an API origin, never provider secrets.
- Recheck active account, current role, and enrollment on protected backend calls. UI visibility is not authorization.
- Verify payment-provider signatures, make webhook processing idempotent, and grant access only from durable paid-order state.
- Review access, session expiration/revocation, rate limiting, audit needs, deletion/retention, and backup/restore before launch.
- `.env.example` contains placeholders only. Never copy source project `.env` files or credentials.

## Comments and maintainability

Comments should record why a security boundary exists, what invariant must hold, provider behavior, or a compatibility constraint. Keep those comments close to the relevant code/API boundary. Avoid comments that simply restate a line. Preserve existing player comments and do not add speculative comments to copied player source.

## Status and next build phases

**Present:** responsive web and Flutter learner previews, platform shells, fresh schema draft, auth/session foundation, health endpoint, preserved player source, player support adapters, dependency lockfile, course-scoped question/quiz APIs, and documentation. Northstar is only a temporary design label.

**Not yet implemented:** sign-up/sign-in screens and APIs, full permission matrix and role assignment workflows, catalog/course administration, checkout and verified payment flow, enrollment creation, manager dashboard, web/Flutter integration with quiz APIs, question edit/archive and quiz revision flows, analytics, integration between course content and player screens, email/receipts, deployment and production controls. Quiz schema changes have not been migrated to a database.

**Recommended order:**

1. Confirm product name, initial roles, course offer rules, and what a paid enrollment grants.
2. Review schema and security model, create a reviewed initial migration against a new local database.
3. Implement identity and role permissions; establish API contracts and error handling.
4. Build manager course/offer/coupon workflows and the public catalog from the new design.
5. Implement order creation, server-side pricing, payment verification, idempotent webhook processing, and enrollment grants.
6. Connect web and Flutter learner experiences to the same enrollment/content APIs and preserved players.
7. Add operational controls, audit/backup/deletion flows, monitoring, then test end-to-end in sandbox environments before launch.
