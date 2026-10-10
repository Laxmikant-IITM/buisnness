# Product QA and release plan

This plan defines the acceptance gates for the combined course, quiz, commerce, and video-learning product. Run it against the new LMS database and sandbox payment accounts. Use synthetic accounts and courses only; do not import data from either reference project.

## Current implementation status

The web app is a sample UI preview, not an operational learning product. The Prisma schema has foundations for users, role-scoped course access, courses, offerings, enrollments, coupons, orders, payment events, questions, quizzes, and attempts. Authorization helpers and API foundations exist for course-scoped question/quiz work and protected video playback.

**Known release gaps:** sign-in and account-management flows; role creation/assignment and a complete permission matrix; real catalog and course administration screens/APIs; offering, coupon, checkout, payment verification/webhooks, refund, and enrollment-grant workflows; quiz learner UI, answer save/submit, scoring, results, and answer autosave; course-to-player integration; mobile sign-in/course APIs; PWA/install experience; production operations. Schema presence is not evidence that a workflow is implemented or safe to launch.

Current quiz foundation covers question creation/listing, quiz creation/listing, draft quiz editing, question ordering, publishing snapshots, learner quiz retrieval, and starting an enrolled learner attempt. The current contract accepts single-choice questions only. No answer save, submit, score, or result endpoint is present yet.

## Test fixture and execution rules

Create disposable records in a fresh test database:

- One account for each role: `SUPER_MANAGER`, `MANAGER`, assigned `ADMIN`, unassigned `ADMIN`, assigned `INSTRUCTOR`, unassigned `INSTRUCTOR`, enrolled `STUDENT`, unenrolled `STUDENT`, expired-enrollment `STUDENT`, disabled account, and unknown role.
- Two courses (A and B), each with a draft and published offering, a course topic, two lessons (one marked demo), a draft quiz, a published quiz, and questions with known answer keys.
- One expired and one active enrollment; one valid/expired/disabled/usage-exhausted coupon; test orders for pending, paid, failed, refunded, and duplicate webhook cases.
- One Drive video and one YouTube video, with a quality variant where available. Use non-sensitive test media.

Run checks against a clean database, with a test run, and after a backup restore. Record app commit, migration revision, environment, device/browser, account role, request/response status, and sanitized logs. Do not include secrets, raw payment payloads, signed playback URLs, or student answers in logs or screenshots.

For API checks, use authenticated sessions for the exact role under test, call the route directly (not only through the UI), and assert both the status code and persisted state. Where an API does not exist, record **GAP** instead of simulating a pass.

## 1. Identity, roles, and access boundaries

| Role | Required positive access | Required denied access |
|---|---|---|
| `SUPER_MANAGER` | Create, assign, suspend, and manage roles below itself; manage all courses, catalog, users, offers, coupons, and operational records | Creating another `SUPER_MANAGER`; allow a documented account-recovery procedure without silently bypassing this rule |
| `MANAGER` | Operate users and course work below Super Manager; manage course operations and content | View/change Super Manager role or account; change global security secrets or payment-provider credentials/settings |
| Assigned `ADMIN` | Manage only explicitly assigned courses, course content, quizzes, and course learners where permitted | Read or mutate unassigned courses; create/manage global roles, settings, or payment-provider secrets |
| Assigned `INSTRUCTOR` | Read assigned course workspace, lessons, quiz definitions, and learner progress needed to teach | Create/edit/publish courses, quizzes, questions, enrollment, offers, coupons, or users by default; read unassigned courses |
| Enrolled `STUDENT` | Read published content and quizzes for active, unexpired enrollments; update only own permitted progress/answers | Draft/unpublished content, unassigned/un-enrolled or expired courses, other learners' records, any staff/commerce management API |

Acceptance scenarios:

1. Sign in as each role, call an allowed route, and confirm the correct scoped data is returned. **GAP:** complete sign-in UI/API and role-management workflows.
2. As assigned Admin A, list and mutate Course A; repeat against Course B and assert `403` (or non-disclosing `404`) and no database change. Repeat for Instructor, Student, and an unknown role.
3. Attempt role escalation directly through the API: Manager creating a Super Manager, Admin granting any role, Instructor changing their own role, and Student changing any role must all fail with no state change. **GAP:** role creation/assignment APIs and fine-grained Manager vs Super Manager capabilities.
4. Disable an account and revoke/increment its session version; its next web and Flutter protected request must fail. Change a user's role while a session exists; the next protected request must use the new role, not stale token claims.
5. Verify session logout, expiration, password reset/change, concurrent sessions, CSRF/origin protections for cookie-authenticated mutations, and brute-force throttling. **GAP:** operational sign-in lifecycle and its acceptance suite.

## 2. Catalog, publishing, enrollment, and commerce

Acceptance scenarios:

1. Create a course in draft, add topics/lessons, and attach an active offering. Anonymous/catalog users must not see the draft. Publishing makes only the intended course and active offer visible. Deactivation/unpublishing removes purchase access without deleting historical orders.
2. A student buys an offer: server-calculated subtotal and discount equal the displayed quote; verified payment creates one durable paid order and one enrollment with the purchased access type and expiry. Replaying the same success notification creates no duplicate enrollment, coupon use, or receipt.
3. Test coupon eligibility at start/end time, minimum order, percentage/fixed amount, maximum uses, per-user use, inactive coupon, case/whitespace normalization, concurrent last-use claims, stacking rules, zero-price offers, rounding, and currency. Client-supplied prices/discounts never affect the total.
4. Test failed, abandoned, pending, captured, refunded, and disputed payments. An unverified or mismatched signature never grants access. A verified webhook received before/after the browser redirect reaches the same final order state. Duplicate and out-of-order events are safe and auditable.
5. Refund a paid order under the configured full/partial policy; record the provider refund and reason, adjust or revoke enrollment according to policy, preserve the order history, reverse coupon/discount accounting consistently, and prevent a refund webhook from refunding twice. **GAP:** refund policy and provider/API workflow.
6. Confirm the student can access the course only while enrollment is active and unexpired. Expire, suspend, or revoke enrollment; new catalog/player/quiz requests must be denied. Existing order history remains visible to authorized staff.
7. Verify staff can see only the sales/order information their role permits. Payment secrets and webhook signing keys are absent from browser bundles, mobile packages, logs, and API responses.

**Current status:** data models exist for `CourseOffering`, `Coupon`, `Order`, `OrderItem`, `CouponUsage`, `PaymentEvent`, `OutboxEvent`, and `Enrollment`, but no complete catalog, checkout, provider verification, webhook, refund, or enrollment-grant flow is implemented. **GAP: all scenarios above.**

## 3. Quiz authoring, delivery, scoring, and progress

Acceptance scenarios:

1. Assigned Admin creates a draft question in Course A, creates a draft quiz, attaches ordered questions, previews it, and publishes. Instructor and Student cannot mutate the question bank or quiz. A question from Course B cannot be attached to Course A.
2. Publish freezes the wording and answer key. Editing the source question later cannot change an already published quiz or an existing attempt. Invalid/empty quizzes, duplicate order values, missing correct answers, unsupported question types, malformed content, and out-of-course references fail validation.
3. Learner quiz APIs omit answer keys, correct-choice flags, and staff-only notes in every state. Verify response JSON, browser network responses, cache, error logs, and client-side state.
4. Only an enrolled student can start a published quiz. An expired or absent enrollment, Instructor, Admin from another course, disabled account, draft quiz, and unknown role cannot start it. Respect maximum attempts and time limit server-side, including concurrent start requests.
5. Save an answer, refresh/reopen the quiz, and confirm the attempt resumes with the answer, timer, presentation order, and attempt number intact. Simulate offline/slow network, duplicate save, out-of-order save, and app termination; recover without losing acknowledged answers.
6. Submit once; server recomputes score from the frozen answer key, ignores client-supplied score/correctness, prevents cross-user or cross-quiz item submissions, and is idempotent on retry. Results show earned/possible points, percent/pass status, learner responses, and explanations only when the quiz's reveal policy allows them.
7. Cover all supported question types and scoring edge cases: unanswered, wrong, exact, duplicate choice IDs, invalid choice IDs, numerical tolerance boundaries, case/spacing in short answers, partial credit if enabled, negative marking if enabled, zero-point/comprehension passages, and total-score floor. Reconcile displayed score to persisted answers and attempt summary.
8. Confirm results and progress are private to the learner and authorized course staff; pagination and exports never leak other-course data.

**Current status:** schema includes `Question`, `QuestionChoice`, `Quiz`, `QuizItem`, `QuizAttempt`, and `QuizAnswer`; routes exist for course question/quiz reads and authoring, draft edit, quiz item replacement, publish, learner quiz retrieval, and starting an attempt. Current question input supports single-choice only. **GAP:** learner UI, answer autosave, submission, server scoring/results, explanations/reveal policy, other question types, attempt review, course lesson placement, and automated negative-access coverage.

## 4. Preserved web and Flutter video behavior

The player implementations are preservation-sensitive. Product shell/API work must not change their behavior without a deliberate player-specific fix.

Acceptance scenarios:

1. Before and after each integration change, compare the preserved web player source files and the three Flutter player Dart files against their approved source snapshot. Any diff requires an explicit player defect, narrow patch, and playback regression approval.
2. On web desktop/mobile and Flutter Android/iOS, play Drive and YouTube lessons; test play/pause, seek, quality selection/fallback, buffering, retry/error state, orientation, background/foreground return, and resume position. Confirm the correct player is chosen for source/device.
3. Drive playback honors byte ranges and seeking; the raw Drive URL/file ID is never exposed to a learner. A copied stream URL without a valid session, an invalid/expired token, wrong content token, disabled user, revoked enrollment, or another course's content is rejected.
4. Quality-variant responses expose allowed labels only, not provider URLs/file IDs. Invalid quality falls back safely. Responses are private/no-store and do not persist in a shared cache.
5. A learner's position is saved to their own record and restored on the same account; another learner cannot read or overwrite it. Instructor progress remains read-only. Verify 0, negative, fractional, very large, and malformed positions are handled safely.
6. Flutter stores tokens securely, sends the same backend authorization, clears local identity on logout, and never embeds server credentials. Offline player file lookup must not accidentally grant new server content access.

**Current status:** player source, support routes, and progress model exist; the learning shell does not yet connect a real course lesson to the players, and login/content provisioning are incomplete. **GAP:** end-to-end playback on real accounts/devices and production Drive configuration. Preserve unchanged player files under `apps/web/src/features/learning/video-player/` and `apps/mobile/lib/shared/widgets/`.

## 5. Responsive behavior and accessibility

There is no sidebar. Navigation must use clear buttons/links; on phones it should feel like an app with persistent bottom navigation and safe-area spacing.

Acceptance scenarios:

1. Open every learner and staff flow at widths 320, 360, 390, 768, 1024, 1366, and 1440 CSS pixels; test portrait and landscape on a tablet and phone. Also test browser zoom at 200% and text scaling on mobile.
2. Confirm no horizontal page overflow, clipped controls, overlapping fixed navigation, inaccessible dialogs, or hidden form actions. Tables, long course titles, math/code questions, quiz answer lists, player controls, and checkout errors remain usable at narrow widths.
3. Mobile navigation has visible current-page state, reachable destinations, safe-area padding, and enough bottom content padding that it never covers the last action. Staff navigation remains button-based without a sidebar.
4. Keyboard-only: every link, button, input, menu, dialog, quiz option, video control, and checkout field has a logical focus order, visible focus, and working keyboard behavior. Escape closes dismissible overlays; focus returns to the opening control.
5. Screen-reader: semantic headings/landmarks, accessible names, current/selected states, error associations, status announcements, quiz option state, progress labels, and captions/transcripts where available. Decorative graphics are ignored.
6. Check contrast, reduced-motion preference, minimum touch targets, responsive reflow, and no color-only meaning. Test Safari iOS, Chrome Android, desktop Chrome/Safari/Firefox/Edge where supported.

**Current status:** CSS has desktop/tablet/mobile layouts and a mobile bottom navigation preview; it has not been verified at the viewport matrix or with assistive technology. **GAP:** real flows, responsive/accessibility acceptance runs, and PWA/install/offline requirements if the product is to be installable.

## 6. Security, reliability, and operations

Acceptance scenarios:

1. Authorization is checked on every protected API/server action using current account state, role, course assignment, and enrollment. Directly call endpoints with manipulated IDs; never rely on hidden UI buttons.
2. Validate all user input server-side; use parameterized ORM calls; constrain uploads and rich content; encode output; protect against CSRF, XSS, IDOR, mass assignment, replay, brute force, and unsafe redirects. Rate-limit authentication, purchase, webhook, upload, and quiz submission paths.
3. Keep `SESSION_SECRET`, database URL, Google credentials, payment keys, and webhook signing secrets in a managed secret store. Rotate/revoke keys and sessions; verify production refuses weak/missing secrets. Do not log credentials, raw tokens, payment data, or answer keys.
4. Test migration from an empty database, rollback/recovery procedure, backup creation, and restore to an isolated database. No reference-project database connection, dump, file storage, or secret is allowed in any LMS environment.
5. Webhook and outbox processing is idempotent, observable, retryable, and has a dead-letter/recovery path. Alerts cover elevated 5xx, payment mismatch, repeated webhook failures, stream errors, job backlog, and backup failure.
6. Add audit records for role changes, course assignment, publish/unpublish, offer/coupon changes, payment/refund state, enrollment revocation, and sensitive exports. Restrict audit access and define retention/deletion policy.
7. Verify HTTPS, secure/HttpOnly/SameSite cookies, security headers, CORS/origin allowlist, no-store learner/protected responses, least-privilege database/provider credentials, dependency/license review, and incident contacts/runbooks.

**Current status:** auth/session helper and several route-level checks exist, but production secrets, complete permission coverage, payment protections, operational monitoring, migration lifecycle, and runbooks are not launch-ready. **GAP:** security review and operational readiness evidence.

## Launch gates

Do not call the product ready for public enrollment until all gates are green:

1. **Scope and policy:** product name, course access rules, coupon rules, refund/expiry policy, quiz answer-reveal policy, and support/contact path are documented.
2. **Role security:** role matrix passes both positive and negative API tests, including escalation and cross-course IDOR checks. Super Manager/Manager global-setting boundaries are independently enforced.
3. **Learner journey:** register/sign in → catalog → course details → offer/discount → checkout → verified payment → enrollment → lesson/video → quiz → saved attempt/result → account/support works on web and Flutter.
4. **Commerce integrity:** sandbox payment and all webhook orderings/retries pass; no access is granted from a browser redirect alone; refund/revocation behavior matches written policy.
5. **Quiz integrity:** answer keys never reach learners before allowed; server autosave/submit/score/result and attempt limits pass; repeated/concurrent requests do not corrupt state.
6. **Player preservation:** approved source comparisons pass and Drive/YouTube playback, access revocation, progress resume, and target-device checks pass.
7. **Device and accessibility:** responsive matrix and keyboard/screen-reader checks pass with no blocking layout or navigation defects.
8. **Operations:** production configuration, secrets, migrations, backups/restore, alerts, audit, rate limits, support ownership, privacy/terms/refund pages, and rollback plan are reviewed.
9. **Release evidence:** attach commit/build identifiers, migration revision, automated/manual results, known limitations, and named release owner. A successful local build alone does not satisfy these gates.

## Current release decision

**Not ready for real customers or paid enrollment.** The current LMS is a prototype with partial schema, authorization, quiz-authoring, and player-support foundations. Treat it as a development preview until the gaps above are implemented and the launch gates have recorded passing evidence.
