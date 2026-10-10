# LMS product foundation

A new learning product is being built in this folder. It combines a course storefront and manager workspace with a Flutter learning app that uses the same backend. The product identity, interface, and product copy are new.

## What exists now

- `apps/web`: Next.js product preview, learner and manager dashboards, sign-in API/UI, Prisma data model and an initial migration file, session/access helpers, health endpoint, and preserved web playback modules plus the support APIs they call.
- `apps/mobile`: Android/iOS Flutter shell, original learner preview screen, preserved Drive and YouTube player modules, and the small support services those modules import.
- `docs`: code ownership, playback dependency map, setup boundaries, and implementation status.

Northstar is a temporary design label, not a confirmed product name. The public course cards still use sample content. The learner dashboard reads active enrollments and progress, and its lesson route uses the preserved player after access checks. The manager dashboard reads role-scoped course, learner, enrollment, quiz, and order summaries. The initial migration is a file only: it has not been applied to a database, and no Supabase project or data connection is configured here. Checkout, payment webhooks, enrollment grants, course editing, and user/role management screens remain unimplemented.

## Product boundaries

- Keep this as a new product in this directory. Do not merge the source repositories or modify them as part of this work.
- Provision a new empty database and new service credentials. No users, courses, orders, coupons, payments, or enrollment data are migrated.
- Start as one modular backend and one database. The Flutter client uses the same backend; it does not get a second business backend.
- Initial scope is accounts and roles, courses and offers, course access/enrollment, discounts, checkout, orders, and focused manager tools.
- Keep role permissions enforced on the server and extensible for future roles.
- Keep the existing web and Flutter video player implementations unchanged. Their copied source files have useful local comments; add comments to new code for security rules, invariants, compatibility decisions, and non-obvious behavior.

## Code map

```text
LMS/
├── apps/
│   ├── web/
│   │   ├── prisma/                 # New product data model
│   │   └── src/
│   │       ├── app/                # Web pages and backend API routes
│   │       ├── features/learning/video-player/  # Preserved web player code
│   │       └── lib/                # Auth, database, provider adapters
│   └── mobile/
│       └── lib/
│           ├── core/               # Session and download lookup support
│           ├── shared/widgets/     # Isolated Drive and YouTube players
│           └── theme/              # Minimal primitives required by players
├── docs/
└── README.md
```

## Local setup

1. Install a supported Node.js LTS release and Flutter SDK.
2. In `apps/web`, copy `.env.example` to `.env.local`, then fill only new local/test credentials. Point `POSTGRES_PRISMA_URL` and `POSTGRES_URL_NON_POOLING` to this product's Supabase project.
3. Install web dependencies and generate the Prisma client. Review and apply `prisma/migrations/` only against this product's new empty local/test database; no migration has been run by this project setup.
4. Set the Flutter `API_BASE_URL` to the local web backend. Android emulator users can use `http://10.0.2.2:3000`; other environments need their reachable host URL.
5. After applying the reviewed initial migration to the new database, create the first platform owner with `db:bootstrap-super-manager`, setting `BOOTSTRAP_SUPER_MANAGER_EMAIL`, `BOOTSTRAP_SUPER_MANAGER_NAME`, and `BOOTSTRAP_SUPER_MANAGER_PASSWORD` (16+ characters) in the local environment. The bootstrap refuses to create another Super Manager.
6. Do not use either reference project's production credentials or data.

## Current implementation status

This is a foundation, not a launch-ready commerce/LMS product. See [Architecture and implementation status](docs/ARCHITECTURE.md) and [Video playback support map](docs/VIDEO_PLAYBACK.md) before extending it.
