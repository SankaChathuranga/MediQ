# CLAUDE.md — MediQueue LK Project Rules

This file is the shared source of truth for every Claude session working on this repo. All four members should keep this file open (or reference it in their prompt) whenever asking Claude/AI tools to write or modify code. **Do not fork or personalize this file per-branch** — it only works if every module follows the same rules.

---

## 1. Project Context

**MediQueue LK** — a pharmacy medicine availability checker for Sri Lanka. Patients search for medicine stock across pharmacies; when nothing's available, they post a request that pharmacies can see and fulfill. Built for SE3090 Assignment 2 (4-hour supervised Mini Hackathon).

**Four CRUD modules, one owner each:**
| Module | Owner | Core entity |
|---|---|---|
| Medicine Catalog | Member 1 | `medicines` |
| Pharmacy Stock | Member 2 | `stock` |
| Pharmacy Directory | Member 3 | `pharmacies` |
| Patient Requests + matching | Member 4 (repo owner) | `requests` |

**Schema:**
```
medicines(id, name, generic_name, category, description)
pharmacies(id, name, address, area, contact, hours)
stock(id, pharmacy_id FK, medicine_id FK, quantity, price, last_updated)
requests(id, patient_contact, medicine_id FK, area, urgency, status, created_at)
```

## 2. Tech Stack (do not substitute)

- **Frontend:** React (Vite) + MUI (Material UI v5+) implementing Material Design 3
- **Backend:** Node.js + Express
- **ORM:** Prisma
- **Database:** PostgreSQL (Neon/Supabase)
- **Validation:** Zod (shared schema definitions used on both frontend and backend where possible)
- **Forms:** React Hook Form

If a Claude session suggests a different library or pattern than what's listed here (e.g. a different UI kit, a different validation library, switching ORMs), **stop and flag it to the team instead of applying it** — consistency across four independently-built modules matters more than any one module being slightly better.

---

## 3. Before Writing Any Code

Every Claude session, on every task, must do this first:

1. **Read the existing code before modifying anything.** Open the relevant component/route/model files and understand current patterns before adding to them. Never write a new version of something without first checking whether it already exists.
2. **Do not touch unrelated features.** If you're working on the Stock module, don't "improve" the Medicine Catalog module's code, refactor shared components you don't own without flagging it, or change files outside your assigned module unless explicitly asked.
3. **Check `/src/components/shared/` before creating a new component.** If a button, form field, table, status badge, or dialog already exists there, use it — don't create a second version with a slightly different name. Duplicate components are the #1 way this project stops looking consistent.
4. **When in doubt about a shared file, ask before editing it.** Shared theme files, shared components, and the Prisma schema are touched by everyone — coordinate changes to them explicitly rather than silently overwriting.

---

## 4. Design System — Material Design 3 + MUI, Blue & White Theme

All four modules use the **same MUI theme file** (`/src/theme.js`) — do not define local colors, fonts, or spacing inside individual components.

```js
// src/theme.js
import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1565C0',      // primary blue — buttons, links, active states
      light: '#5E92F3',
      dark: '#003C8F',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#0288D1',      // secondary blue accent
    },
    background: {
      default: '#FFFFFF',
      paper: '#F5F8FC',      // very light blue-white for cards/surfaces
    },
    error: { main: '#D32F2F' },
    warning: { main: '#ED6C02' },  // low stock
    success: { main: '#2E7D32' },  // in stock / fulfilled
    text: {
      primary: '#1A1C1E',
      secondary: '#44474A',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Public Sans", sans-serif',
    h1: { fontWeight: 600 },
    h2: { fontWeight: 600 },
    button: { textTransform: 'none' }, // MD3 buttons are not all-caps
  },
  shape: {
    borderRadius: 12, // MD3 uses larger, consistent corner radii
  },
});
```

**Rules everyone follows:**
- Use MUI components (`Button`, `TextField`, `Card`, `Chip`, `Dialog`, `Snackbar`, etc.) — do not hand-roll custom versions of things MUI already provides.
- Use theme palette tokens (`theme.palette.primary.main`, etc.) — never hardcode a hex color inside a component.
- Spacing uses the MUI `theme.spacing()` scale (multiples of 8px) — no arbitrary pixel margins.
- Buttons: primary actions use `variant="contained"` with `color="primary"`; secondary/cancel actions use `variant="outlined"` or `variant="text"`. Keep this consistent across all four modules.
- Forms: all text fields use MUI `TextField` with the same label/helper-text/error pattern (see §9 below).
- Status is always shown as **color + icon + text label together** — never color alone (e.g. a green `Chip` reading "In Stock", not just a green dot).

---

## 5. Naming Conventions (frontend ↔ backend must match)

- **Database/Prisma fields:** `snake_case` (e.g. `pharmacy_id`, `last_updated`) — matches the schema in §1.
- **API JSON payloads:** `camelCase` (e.g. `pharmacyId`, `lastUpdated`) — Prisma/Express layer converts between them; don't send raw snake_case to the frontend.
- **React components:** `PascalCase` file and component names (e.g. `StockList.jsx`, `RequestForm.jsx`).
- **API routes:** plural, kebab-case resource names — `/api/medicines`, `/api/pharmacy-stock`, `/api/requests`.
- **Route handlers/controllers:** `camelCase` function names matching the action — `getMedicines`, `createStockEntry`, `updateRequestStatus`.

Keep this table updated if any module introduces a new resource — post it in the team chat, don't just merge a naming pattern nobody agreed on.

---

## 6. API Contract

**Use DTOs.** Don't return raw Prisma model objects directly from routes — shape the response explicitly (even a simple mapping function) so the frontend never depends on internal DB structure changing.

**Validate on both ends:**
- Backend: every POST/PUT route validates the request body with a Zod schema before touching the database. Return a 400 with field-level errors on failure.
- Frontend: the same shape of validation (ideally the same Zod schema, shared via a `/src/shared/schemas/` folder) runs in the form before submission, showing inline errors next to each field.

**Consistent HTTP status codes:**
| Situation | Code |
|---|---|
| Successful GET/PUT | 200 |
| Successful POST (created) | 201 |
| Successful DELETE | 204 |
| Validation error | 400 |
| Not found | 404 |
| Server error | 500 |

**Consistent response shape:**
```json
// Success
{ "success": true, "data": { ... } }

// Error
{ "success": false, "error": { "message": "Quantity must be 0 or greater", "field": "quantity" } }
```
Every module's Express routes return this exact shape — don't let one module return bare objects and another wrap them differently.

---

## 7. Environment & Secrets

- All config (database URL, API keys, ports) goes in `.env` — **never hardcode connection strings or API keys in source files.**
- Commit a `.env.example` with every required key present but empty/placeholder values, so any teammate can copy it to `.env` and know exactly what to fill in.
- `.gitignore` must include `.env`, `node_modules/`, `dist/`, `build/`, and any local Prisma migration lock artifacts you don't want committed. Set this up **before** the first commit — not after someone accidentally pushes a real connection string.

---

## 8. Database

- One PostgreSQL instance (Neon/Supabase), one shared `schema.prisma` — all four modules' models live in the same schema file since they share foreign keys (`stock.medicine_id → medicines.id`, `stock.pharmacy_id → pharmacies.id`, `requests.medicine_id → medicines.id`).
- Run migrations from one place (coordinate with the repo owner) to avoid migration-history conflicts between branches.
- Seed data covers all four tables together (~15–20 medicines, 5–6 pharmacies, matching stock rows, a few sample requests) so the app looks realistic the moment anyone pulls the branch.

---

## 9. Testing Checklist (every module, before merging)

- [ ] Create, read, update, delete all work for this module's entity
- [ ] Search/filter functionality returns correct results (and empty results gracefully)
- [ ] Foreign-key relationships resolve correctly (e.g. stock entry shows the right medicine + pharmacy names, not just IDs)
- [ ] Loading state shown while data fetches (skeleton or spinner, not a blank screen)
- [ ] Error state shown if a request fails (readable message, not a raw stack trace)
- [ ] Empty state shown when there's no data yet (e.g. "No medicines found — try a different search" not a blank list)
- [ ] Delete actions require a confirmation dialog before executing
- [ ] Layout is responsive down to mobile width
- [ ] Tested in an incognito window against the deployed (not local) backend

---

## 10. Domain-Specific UI Rules

- **Stock status must be immediately scannable:** use a `Chip` with color + text — "In Stock" (success/green), "Low Stock" (warning/orange), "Out of Stock" (error/red). Never rely on quantity numbers alone.
- **Always show `last_updated`** on stock entries, in a relative/readable format (e.g. "Updated 2 hours ago"), so patients know how current the data is.
- **Keep patient-facing and pharmacy/admin-facing UX visibly distinct.** Patients search and post requests; pharmacies manage stock and view requests. Use different layouts, nav, or a role toggle — don't let both experiences share one undifferentiated dashboard.

---

## 11. Git & Deployment Workflow

- Run tests (or at minimum, manually verify the checklist in §9) **before** merging into `main`.
- `main` must always be in a deployable state — no broken commits pushed directly to it. Work in feature branches per module, merge when your module's checklist passes.
- After merging, test the actual production deployment (not just localhost) in an incognito window before considering a module "done."
- Meaningful commit messages per change, not one dump commit at the end — this is a scored rubric item.

---

## 12. Documentation (repo owner coordinates, everyone contributes their section)

- **`README.md`** — project title, problem, solution, features, tech/AI tools used, team member contributions, install/run instructions, deployed app link, demo video link.
- **`ARCHITECTURE.md`** — high-level system diagram/description: how frontend, backend, and database connect; how the four modules relate; where the matching logic lives.
- **`API.md`** — every route, method, request/response shape, and status codes, grouped by module.
- **`DATABASE.md`** — the schema (from §1), relationships between tables, and what each field means.

Each member documents their own module's section of `API.md`; the repo owner assembles `README.md` and `ARCHITECTURE.md`.
