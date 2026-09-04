# MediQueue LK — Base Scaffold Prompt

Run this first, before any member starts their own module prompt. This builds
the shared foundation — repo structure, theme, database schema, route stubs,
page stubs — so you can push one commit to `main`, create four branches off
it, and let all three teammates start immediately instead of waiting on you.

Paste `CLAUDE.md` into the session first (or attach it), then paste this:

```
You're scaffolding the shared base of MediQueue LK before any feature work
starts. Follow CLAUDE.md exactly — this scaffold IS the implementation of
CLAUDE.md's rules, not a separate thing. Everything you build here becomes
the shared foundation four teammates branch off of, so favor clarity and
working stubs over cleverness.

Set up a monorepo with /client and /server folders.

## 1. Root level
- CLAUDE.md at repo root (already provided — do not overwrite it)
- .gitignore covering: node_modules/, dist/, build/, .env, .env.local,
  *.log, and Prisma's local migration lock artifacts
- README.md with placeholder sections for: project title, problem, solution,
  features, tech/AI tools used, team contributions, install/run instructions,
  deployed link, video link — headers only, content filled in later
- ARCHITECTURE.md and API.md and DATABASE.md as empty files with section
  headers matching CLAUDE.md §12, ready for each member to fill in their part

## 2. /server (Express + Prisma + PostgreSQL)
- Express app (server.js or app.js) with CORS enabled, JSON body parsing,
  and a health-check route (GET /api/health returning { success: true })
- .env.example with DATABASE_URL and PORT as placeholder keys (no real
  values)
- Prisma schema (schema.prisma) with ALL FOUR models already defined and
  related, using snake_case fields exactly as specified:

  model Medicine {
    id           Int      @id @default(autoincrement())
    name         String
    generic_name String
    category     String
    description  String?
    stock        Stock[]
    requests     Request[]
  }

  model Pharmacy {
    id      Int     @id @default(autoincrement())
    name    String
    address String
    area    String
    contact String
    hours   String
    stock   Stock[]
  }

  model Stock {
    id           Int      @id @default(autoincrement())
    pharmacy_id  Int
    medicine_id  Int
    quantity     Int
    price        Float
    last_updated DateTime @updatedAt
    pharmacy     Pharmacy @relation(fields: [pharmacy_id], references: [id])
    medicine     Medicine @relation(fields: [medicine_id], references: [id])
  }

  model Request {
    id              Int      @id @default(autoincrement())
    patient_contact String
    medicine_id     Int
    area            String
    urgency         String
    status          String   @default("open")
    created_at      DateTime @default(now())
    medicine        Medicine @relation(fields: [medicine_id], references: [id])
  }

- A seed.js that inserts a small starter set (2–3 medicines, 2 pharmacies,
  1–2 stock rows) — enough that `npm run dev` shows *something* immediately.
  Each member will expand this with their own realistic sample data later;
  leave a clear comment marking where to add more.
- Four route files, one per module, each mounted but returning only a
  stub response for now (empty array / 501) so each member has a clean file
  to fill in without touching anyone else's:
  - server/routes/medicines.js  → mounted at /api/medicines
  - server/routes/stock.js      → mounted at /api/stock
  - server/routes/pharmacies.js → mounted at /api/pharmacies
  - server/routes/requests.js   → mounted at /api/requests
  Each stub file should already follow the CLAUDE.md §6 response shape
  ({ success, data } / { success, error }) so nobody has to remember that
  convention when they start — they just fill in the logic.
- A shared /server/middleware/validate.js helper that takes a Zod schema and
  returns Express middleware — so each member's route file can just import
  and use it instead of rewriting validation boilerplate.

## 3. /client (React + Vite + MUI, Material Design 3)
- Vite React app scaffolded
- src/theme.js — implement the exact MUI theme object from CLAUDE.md §4
  (blue/white MD3 palette, typography, borderRadius) — do not modify these
  values, this is the one file that must not drift between modules
- App.jsx wrapped in MUI's ThemeProvider using this theme
- A shared app shell: top nav/tabs linking four routes — /medicines, /stock,
  /pharmacies, /requests — using React Router
- Four placeholder page components, one per module, each just rendering a
  centered "MODULE_NAME — coming soon" message inside the shared layout, so
  navigation between all four sections already works on day one:
  - src/pages/MedicineCatalog.jsx
  - src/pages/StockList.jsx
  - src/pages/PharmacyDirectory.jsx
  - src/pages/PatientRequests.jsx
- src/components/shared/ folder with three real, working components other
  modules will reuse (build these now so nobody duplicates them later):
  - StatusChip.jsx — takes a status string + variant (success/warning/error)
    and renders an MUI Chip with icon + color + text, per CLAUDE.md §4 and §10
  - ConfirmDialog.jsx — a reusable MUI Dialog for delete confirmations
    (CLAUDE.md §9), takes title/message/onConfirm/onCancel props
  - FormField.jsx — a thin wrapper around MUI TextField/Select that shows
    inline validation error text consistently
- .env.example for the client with VITE_API_URL as a placeholder
- axios instance in src/api/client.js pre-configured with the base URL from
  VITE_API_URL, so every module's API calls go through one place

## 4. Root package.json / scripts
- A root script (or a simple README instruction) to run client and server
  together in dev — e.g. two terminal commands, or use `concurrently` if you
  want one command
- Confirm `npm run dev` in /server and /client both start cleanly with no
  errors before you commit

## 5. Final steps (do these yourself after the AI session finishes)
- Run `npx prisma migrate dev` against your provisioned database, confirm
  the seed script runs, confirm /api/health returns success
- Confirm the four placeholder pages render and navigation works
- Commit everything to main with a clear message ("Project scaffold: shared
  theme, schema, route/page stubs")
- Create four feature branches off main — one per module (e.g.
  feature/medicines, feature/stock, feature/pharmacies, feature/requests)
- Push all of it, share repo access with your teammates, and point each of
  them to their branch + their prompt from MediQueue_Member_Prompts.md
```

Once this is pushed, your teammates aren't waiting on your module — they're pulling a working shell with the shared theme, shared components, and their own stub files already in place, and can start immediately from their own branch.
