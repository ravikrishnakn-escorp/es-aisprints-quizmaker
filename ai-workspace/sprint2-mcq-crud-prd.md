Date created: September 4, 2026
Date last modified: September 4, 2026

# MCQ CRUD — Technical PRD (Sprint 2)

## Overview/Problem

Quiz Maker authenticated users can sign in and reach a protected Dashboard, but they cannot yet create, manage, or answer multiple-choice questions. Educators and administrators who want to build quiz content have no way to define questions, attach answer choices, or track who answered what. Without a foundational MCQ module, the product cannot progress toward full quiz creation, delivery, or reporting.

This sprint delivers end-to-end **Multiple Choice Question (MCQ) CRUD** — database schema, service layer, HTTP API, and an administration UI — building directly on the Sprint 1 authentication architecture (session cookies, `requireAuth`, D1 persistence, Zod validation, shadcn/ui).

---

## Hypothesis

We believe that providing authenticated administrators with a reliable MCQ CRUD workflow — backed by a normalized schema, a test-driven service layer, and a clear dashboard UI — will establish the data and interaction foundation required for future quiz assembly, delivery, and analytics features.

---

## Scope

### In Scope

- Relational D1 schema for `mcq`, `mcq_choices`, and `mcq_attempts` with referential integrity and audit timestamps
- D1 migration (`0002_create_mcq_tables.sql`) applied locally only
- `MCQService` in `src/lib/services/mcq.ts` orchestrating all MCQ business logic and atomic transactions
- Zod validation schemas in `src/lib/validations/mcq.ts`
- REST API route handlers under `src/app/api/mcqs/` delegating entirely to `MCQService`
- Session-based authentication on every API route (Sprint 1 `getCurrentUser` / `requireAuth` pattern)
- Expansion of the Dashboard stub (`src/app/dashboard/page.tsx`) into an MCQ administration table view
- Dedicated create/edit pages for MCQ management with dynamic choice inputs (2–6 choices)
- Recording user answer attempts via `POST /api/mcqs/:id/attempts` with server-side correctness evaluation
- **Test-Driven Architecture (TDA):** failing tests written and agreed upon before implementation in each phase
- Vitest unit, integration, API contract, and component tests colocated with source files

### Out of Scope

- Full quiz entity (grouping multiple MCQs into a quiz)
- Quiz publishing, folders, or tagging
- Timed quizzes, scoring dashboards, or leaderboards
- Bulk import/export of questions
- AI-generated questions
- Role-based permissions (all authenticated users may manage MCQs in this sprint)
- Public/anonymous attempt endpoints
- File or image attachments on questions or choices
- Dedicated "take a quiz" learner UI (attempt API is implemented; learner-facing UI deferred)

### Cut

- **Server Actions for MCQ mutations** — Sprint 1 uses Server Actions for auth forms, but this sprint standardizes on REST route handlers to establish a reusable HTTP contract for MCQ operations and future external consumers.
- **Soft delete for MCQs** — Hard delete with `ON DELETE CASCADE` is simpler and sufficient for v1; soft delete adds query complexity without a stated requirement.
- **Multiple correct answers per MCQ** — Exactly one `is_correct = true` choice is enforced to keep scoring unambiguous; multi-select can be added later with schema and UI changes.
- **Pagination on dashboard (v1)** — `GET /api/mcqs` supports optional `limit`/`offset` query params for forward compatibility, but the initial UI may render a full list until volume warrants paging controls.
- **Per-user MCQ ownership enforcement** — `created_by_user_id` is stored for audit purposes; all authenticated users can CRUD any MCQ in this sprint. Ownership scoping is deferred until roles are introduced.

---

## Technical Requirements

### Database Schema

Three new tables extend the existing `users` table from `migrations/0001_create_auth_tables.sql`.

#### Entity relationship

```
users (existing)
  │
  ├──< mcq (created_by_user_id)
  │      │
  │      ├──< mcq_choices (mcq_id, ON DELETE CASCADE)
  │      │
  │      └──< mcq_attempts (mcq_id)
  │              │
  │              ├──> users (user_id)
  │              └──> mcq_choices (selected_choice_id)
```

#### Migration: `migrations/0002_create_mcq_tables.sql`

```sql
-- Migration number: 0002    2026-09-04T00:00:00.000Z

CREATE TABLE mcq (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  question TEXT NOT NULL,
  created_by_user_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by_user_id) REFERENCES users (id) ON DELETE RESTRICT
);

CREATE TABLE mcq_choices (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  mcq_id TEXT NOT NULL,
  choice_text TEXT NOT NULL,
  is_correct INTEGER NOT NULL DEFAULT 0 CHECK (is_correct IN (0, 1)),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (mcq_id) REFERENCES mcq (id) ON DELETE CASCADE
);

CREATE TABLE mcq_attempts (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  mcq_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  selected_choice_id TEXT NOT NULL,
  is_correct INTEGER NOT NULL CHECK (is_correct IN (0, 1)),
  attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (mcq_id) REFERENCES mcq (id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  FOREIGN KEY (selected_choice_id) REFERENCES mcq_choices (id) ON DELETE RESTRICT
);

CREATE INDEX idx_mcq_created_by_user_id ON mcq (created_by_user_id);
CREATE INDEX idx_mcq_choices_mcq_id ON mcq_choices (mcq_id);
CREATE INDEX idx_mcq_attempts_mcq_id ON mcq_attempts (mcq_id);
CREATE INDEX idx_mcq_attempts_user_id ON mcq_attempts (user_id);
```

#### Column reference

| Table | Column | Type | Constraints |
|-------|--------|------|-------------|
| `mcq` | `id` | TEXT | PK, auto-generated |
| `mcq` | `name` | TEXT | NOT NULL; short identifier/label (e.g., "Chapter 1 Q3") |
| `mcq` | `question` | TEXT | NOT NULL; full question body |
| `mcq` | `created_by_user_id` | TEXT | NOT NULL; FK → `users.id` |
| `mcq` | `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP |
| `mcq` | `updated_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP |
| `mcq_choices` | `id` | TEXT | PK, auto-generated |
| `mcq_choices` | `mcq_id` | TEXT | NOT NULL; FK → `mcq.id` ON DELETE CASCADE |
| `mcq_choices` | `choice_text` | TEXT | NOT NULL |
| `mcq_choices` | `is_correct` | INTEGER | NOT NULL; 0 or 1 (SQLite boolean) |
| `mcq_choices` | `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP |
| `mcq_choices` | `updated_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP |
| `mcq_attempts` | `id` | TEXT | PK, auto-generated |
| `mcq_attempts` | `mcq_id` | TEXT | NOT NULL; FK → `mcq.id` ON DELETE CASCADE |
| `mcq_attempts` | `user_id` | TEXT | NOT NULL; FK → `users.id` |
| `mcq_attempts` | `selected_choice_id` | TEXT | NOT NULL; FK → `mcq_choices.id` |
| `mcq_attempts` | `is_correct` | INTEGER | NOT NULL; denormalized at insert time |
| `mcq_attempts` | `attempted_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP |

#### Business rules enforced at service layer

| Rule | Enforcement |
|------|-------------|
| Minimum 2 choices per MCQ | Zod schema + `MCQService` validation before insert/update |
| Maximum 6 choices per MCQ | Zod schema + `MCQService` validation before insert/update |
| Exactly 1 correct choice | Zod refinement: `choices.filter(c => c.is_correct).length === 1` |
| Non-empty `name` and `question` | Zod + DB NOT NULL |
| Non-empty `choice_text` per choice | Zod per-item validation |
| `selected_choice_id` belongs to `mcq_id` on attempt | `MCQService.recordAttempt` verifies choice ownership before insert |
| `updated_at` refresh on MCQ/choice mutation | Service sets `updated_at = CURRENT_TIMESTAMP` on UPDATE |

#### Cascade behavior

| Action | Result |
|--------|--------|
| DELETE `mcq` row | All related `mcq_choices` and `mcq_attempts` rows deleted (CASCADE) |
| DELETE `users` row | Blocked if user created MCQs (`ON DELETE RESTRICT` on `mcq.created_by_user_id`); `mcq_attempts` for user deleted if user deleted via cascade path on attempts only |
| DELETE `mcq_choices` row referenced by attempt | Blocked (`ON DELETE RESTRICT` on `selected_choice_id`) |

---

### API Endpoints

All endpoints require a valid session cookie (`SESSION_COOKIE_NAME` from Sprint 1). Unauthenticated requests return **401 Unauthorized**. Route handlers perform HTTP transport only; all business logic lives in `MCQService`.

Shared error response shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable summary",
    "details": []
  }
}
```

#### GET /api/mcqs

List MCQs for the authenticated user's table view.

**Query parameters (optional):**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `limit` | number | 50 | Max rows returned |
| `offset` | number | 0 | Pagination offset |

**Response (200):**

```json
{
  "data": [
    {
      "id": "abc123",
      "name": "Photosynthesis Basics",
      "question": "Which organelle conducts photosynthesis?",
      "created_by_user_id": "user-id",
      "created_at": "2026-09-04T10:00:00.000Z",
      "updated_at": "2026-09-04T10:00:00.000Z",
      "choice_count": 4
    }
  ],
  "meta": { "limit": 50, "offset": 0, "total": 1 }
}
```

**Errors:**

- `401` — No valid session
- `500` — Unexpected server error

---

#### POST /api/mcqs

Create a new MCQ with its choices in a single atomic transaction.

**Request body:**

```json
{
  "name": "Photosynthesis Basics",
  "question": "Which organelle conducts photosynthesis?",
  "choices": [
    { "choice_text": "Mitochondria", "is_correct": false },
    { "choice_text": "Chloroplast", "is_correct": true }
  ]
}
```

**Response (201):**

```json
{
  "data": {
    "id": "abc123",
    "name": "Photosynthesis Basics",
    "question": "Which organelle conducts photosynthesis?",
    "created_by_user_id": "user-id",
    "created_at": "2026-09-04T10:00:00.000Z",
    "updated_at": "2026-09-04T10:00:00.000Z",
    "choices": [
      { "id": "choice-1", "choice_text": "Mitochondria", "is_correct": false },
      { "id": "choice-2", "choice_text": "Chloroplast", "is_correct": true }
    ]
  }
}
```

**Errors:**

- `400` — Validation failure (missing fields, <2 or >6 choices, not exactly one correct)
- `401` — No valid session
- `500` — Transaction failure

---

#### GET /api/mcqs/:id

Fetch a single MCQ with all choices (used by the edit form).

**Response (200):** Same shape as POST response `data` object.

**Errors:**

- `401` — No valid session
- `404` — MCQ not found
- `500` — Unexpected server error

---

#### PUT /api/mcqs/:id

Update an existing MCQ and sync its choices. Sync strategy: **replace all choices** — delete existing choices for the MCQ, insert the new set within a transaction. Existing `mcq_attempts` referencing old choice IDs are preserved (old choices cannot be deleted if attempts exist; service must handle this by rejecting destructive updates that would orphan attempts, or by using a upsert strategy — see Implementation Notes).

**Recommended v1 strategy:** If attempts exist for an MCQ, reject choice replacement that would delete referenced choices with `409 CONFLICT`. For MCQs with no attempts, full replace is allowed.

**Request body:** Same as POST.

**Response (200):** Updated MCQ object (same shape as POST response).

**Errors:**

- `400` — Validation failure
- `401` — No valid session
- `404` — MCQ not found
- `409` — Cannot replace choices because attempts reference existing choices
- `500` — Transaction failure

---

#### DELETE /api/mcqs/:id

Delete an MCQ and cascade-delete its choices and attempts.

**Response (204):** No body.

**Errors:**

- `401` — No valid session
- `404` — MCQ not found
- `500` — Unexpected server error

---

#### POST /api/mcqs/:id/attempts

Record a user's answer, evaluate correctness server-side, and persist to `mcq_attempts`.

**Request body:**

```json
{
  "selected_choice_id": "choice-2"
}
```

**Response (201):**

```json
{
  "data": {
    "id": "attempt-id",
    "mcq_id": "abc123",
    "user_id": "user-id",
    "selected_choice_id": "choice-2",
    "is_correct": true,
    "attempted_at": "2026-09-04T11:00:00.000Z"
  }
}
```

**Errors:**

- `400` — Missing `selected_choice_id` or choice does not belong to MCQ
- `401` — No valid session
- `404` — MCQ or choice not found
- `500` — Unexpected server error

---

### User Interface Requirements

All MCQ admin pages are **protected** (require authentication via `requireAuth()`). Use existing shadcn/ui primitives (`table`, `button`, `card`, `field`, `input`, `dialog`) and add `dropdown-menu` for the actions column.

#### Page: Questions Dashboard (`/dashboard`)

Expands the current Dashboard stub into the MCQ administration home.

**Layout elements:**

- Page title: "Questions" (or "MCQ Dashboard")
- Welcome line with authenticated user's name (retain from Sprint 1)
- Primary action: **"Create New Question"** button above the table → navigates to `/dashboard/questions/new`
- **Logout** control (retain from Sprint 1)
- Interactive shadcn `Table` with columns:

| Column | Content |
|--------|---------|
| Question Name | `mcq.name` |
| Question Text | `mcq.question` (truncate with ellipsis if long) |
| Actions | Vertical ellipsis (⋮) dropdown |

**Actions dropdown (per row):**

- **Edit** → navigates to `/dashboard/questions/[id]/edit`
- **Delete** → confirmation dialog, then `DELETE /api/mcqs/:id`, refresh table on success

**States:**

- Loading skeleton while fetching
- Empty state: "No questions yet. Create your first question."
- Error banner on fetch failure with retry option

---

#### Page: Create Question (`/dashboard/questions/new`)

Unified form for creation (edit page reuses the same form component).

**Form fields:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Name | Text input | Yes | Non-empty, max 120 chars |
| Question | Textarea or text input | Yes | Non-empty, max 2000 chars |
| Choices | Dynamic list | Yes | 2–6 items |
| Choice text (per row) | Text input | Yes | Non-empty, max 500 chars |
| Correct answer (per row) | Radio button group | Yes | Exactly one selected |

**Dynamic choice behavior:**

- Form initializes with **2 choice rows**
- **"Add choice"** button appends a row until 6 total; button disabled/hidden at 6
- **"Remove"** per row allowed when more than 2 rows exist
- Radio buttons enforce single correct selection

**Form actions:**

| Button | Behavior |
|--------|----------|
| **Save** | `POST /api/mcqs` → on success, redirect to `/dashboard` |
| **Cancel** | Navigate to `/dashboard` without persisting |

**Error handling:**

- Inline field errors from Zod validation (client-side) and API 400 responses (server-side)
- Submit button shows loading/disabled state during save

---

#### Page: Edit Question (`/dashboard/questions/[id]/edit`)

Same form component as create, pre-populated via `GET /api/mcqs/:id`.

**Form actions:**

| Button | Behavior |
|--------|----------|
| **Save** | `PUT /api/mcqs/:id` → on success, redirect to `/dashboard` |
| **Cancel** | Navigate to `/dashboard` without persisting |

**Additional states:**

- Loading while fetching existing MCQ
- 404 handling if MCQ does not exist

---

## Implementation Phases

Each phase follows **Test-Driven Architecture (TDA)**: define failing tests first, implement minimum code to pass, refactor, then mark phase complete. No phase is considered done until its test suite is green.

---

### Phase 1: Database Schema & Data Modeling — COMPLETED

**Objective:** Establish the `mcq`, `mcq_choices`, and `mcq_attempts` tables with referential integrity, indexes, and service-layer validation rules verified by unit tests before any API or UI work begins.

**Completed:** September 4, 2026

**TDA — Test strategy (write these tests first):**

| Test file | Type | What it proves |
|-----------|------|----------------|
| `src/lib/validations/mcq.test.ts` | Unit | Zod schemas reject invalid payloads before DB touch |
| `src/lib/services/mcq.persistence.test.ts` | Unit (mocked D1) | Service CRUD operations and constraint handling |

**TDA — Required test cases:**

**Schema & validation unit tests (`mcq.test.ts`):**

1. **Valid payload passes** — 2 choices, exactly 1 correct → schema parse succeeds
2. **Reject empty name** — `name: ""` → validation error
3. **Reject empty question** — `question: ""` → validation error
4. **Reject fewer than 2 choices** — 1 choice → validation error with code `TOO_FEW_CHOICES`
5. **Reject more than 6 choices** — 7 choices → validation error with code `TOO_MANY_CHOICES`
6. **Reject zero correct answers** — all `is_correct: false` → validation error `EXACTLY_ONE_CORRECT`
7. **Reject multiple correct answers** — 2+ `is_correct: true` → validation error `EXACTLY_ONE_CORRECT`
8. **Reject empty choice_text** — whitespace-only choice → validation error
9. **Attempt payload requires selected_choice_id** — missing field → validation error

**Persistence unit tests (`mcq.persistence.test.ts`)** — mock D1 using the same `vi.hoisted` pattern as `src/lib/services/persistence.test.ts`:

1. **Create MCQ inserts parent and child rows atomically** — assert 1 `mcq` row and N `mcq_choices` rows
2. **Create rolls back on partial failure** — if choice insert fails, no orphan `mcq` row remains
3. **Foreign key: `created_by_user_id` must reference existing user** — invalid user ID → error
4. **Cascade delete removes choices** — delete MCQ → related choices no longer queryable
5. **Cascade delete removes attempts** — delete MCQ → related attempts no longer queryable
6. **Cannot create MCQ with 1 choice** — service throws before DB insert
7. **Cannot create MCQ with 7 choices** — service throws before DB insert
8. **Record attempt calculates `is_correct` correctly** — correct choice → `is_correct: 1`; wrong → `0`
9. **Record attempt rejects choice from different MCQ** — `selected_choice_id` mismatch → error
10. **List MCQs returns expected shape** — includes `choice_count` or equivalent

**Tasks:**

1. Write failing tests in `mcq.test.ts` and `mcq.persistence.test.ts`
2. Create migration `migrations/0002_create_mcq_tables.sql`
3. Apply migration locally: `npx wrangler d1 migrations apply <db-name> --local`
4. Implement `src/lib/validations/mcq.ts` (Zod schemas)
5. Implement `src/lib/services/mcq.ts` with `createMcq`, `listMcqs`, `getMcqById`, `updateMcq`, `deleteMcq`, `recordAttempt`
6. Run `npm run test` — all Phase 1 tests green

**Deliverables:**

- `migrations/0002_create_mcq_tables.sql`
- `src/lib/validations/mcq.ts` + `mcq.test.ts`
- `src/lib/services/mcq.ts` + `mcq.persistence.test.ts`
- Green Phase 1 test suite

---

### Phase 2: Services & API Endpoint Layers — PLANNED

**Objective:** Expose `MCQService` through authenticated REST route handlers. Route handlers validate input, check auth, call the service, and map results to HTTP responses. No business logic in route files.

**Architecture:**

```
HTTP Request
    │
    ▼
src/app/api/mcqs/**/route.ts   ← auth check, Zod parse, HTTP status mapping
    │
    ▼
MCQService (src/lib/services/mcq.ts)   ← business logic, transactions
    │
    ▼
getDb() → D1
```

**TDA — Test strategy (write these tests first):**

| Test file | Type | What it proves |
|-----------|------|----------------|
| `src/app/api/mcqs/route.test.ts` | API contract | GET list, POST create |
| `src/app/api/mcqs/[id]/route.test.ts` | API contract | GET one, PUT update, DELETE |
| `src/app/api/mcqs/[id]/attempts/route.test.ts` | API contract | POST attempt |
| `src/lib/services/mcq.test.ts` | Integration | Service functions against mock D1 with realistic scenarios |

**TDA — Required test cases:**

**API contract tests (mock `MCQService` and auth):**

1. **GET /api/mcqs — 200** — authenticated user receives list payload
2. **GET /api/mcqs — 401** — no session cookie → unauthorized
3. **POST /api/mcqs — 201** — valid body → created MCQ returned
4. **POST /api/mcqs — 400** — missing `question` → validation error body
5. **POST /api/mcqs — 400** — 1 choice in array → validation error
6. **POST /api/mcqs — 401** — unauthenticated → 401
7. **GET /api/mcqs/:id — 200** — returns MCQ with choices
8. **GET /api/mcqs/:id — 404** — unknown ID
9. **PUT /api/mcqs/:id — 200** — valid update returns updated entity
10. **PUT /api/mcqs/:id — 400** — 7 choices in payload
11. **PUT /api/mcqs/:id — 404** — unknown ID
12. **DELETE /api/mcqs/:id — 204** — successful deletion
13. **DELETE /api/mcqs/:id — 404** — unknown ID
14. **POST /api/mcqs/:id/attempts — 201** — returns attempt with correct `is_correct`
15. **POST /api/mcqs/:id/attempts — 400** — choice not belonging to MCQ
16. **POST /api/mcqs/:id/attempts — 401** — unauthenticated

**Service integration tests (mock D1, real service code):**

1. **Full CRUD lifecycle** — create → read → update → delete
2. **Concurrent choice validation** — update with invalid choice count rejected
3. **Attempt correctness** — record attempt against known correct/incorrect choice IDs
4. **Auth user ID stamped on create** — `created_by_user_id` matches session user
5. **Transaction atomicity on update** — partial failure leaves original data intact

**Tasks:**

1. Write failing API contract tests for all five endpoints
2. Write failing service integration tests
3. Create route handlers:
   - `src/app/api/mcqs/route.ts` (GET, POST)
   - `src/app/api/mcqs/[id]/route.ts` (GET, PUT, DELETE)
   - `src/app/api/mcqs/[id]/attempts/route.ts` (POST)
4. Create `src/lib/api/auth.ts` helper: `requireApiAuth(request)` → `PublicUser` or `Response(401)`
5. Implement handlers delegating to `MCQService`; no SQL in route files
6. Run `npm run test` — all Phase 1 + Phase 2 tests green
7. Run `npm run build` — no type errors

**Deliverables:**

- `src/app/api/mcqs/route.ts` + tests
- `src/app/api/mcqs/[id]/route.ts` + tests
- `src/app/api/mcqs/[id]/attempts/route.ts` + tests
- `src/lib/api/auth.ts` (API auth helper)
- Green Phase 2 test suite

---

### Phase 3: Frontend Architecture & UI Design — PLANNED

**Objective:** Expand the Dashboard stub into a full MCQ administration workflow with a list table, create/edit form, and actions dropdown. Client components call the Phase 2 API routes; server components handle auth gating.

**TDA — Test strategy (write these tests first):**

| Test file | Type | What it proves |
|-----------|------|----------------|
| `src/components/mcq/mcq-table.test.tsx` | Component | Table rendering, dropdown actions |
| `src/components/mcq/mcq-form.test.tsx` | Component | Dynamic choices, validation, submit |
| `src/app/dashboard/page.test.tsx` | Component/Integration | Dashboard renders table and create button |
| `src/app/dashboard/questions/new/page.test.tsx` | Component | Create page renders form |
| `src/app/dashboard/questions/[id]/edit/page.test.tsx` | Component | Edit page loads and submits |
| `e2e/mcq-crud.spec.ts` (optional, if Playwright added) | E2E | Full browser workflow |

**TDA — Required test cases:**

**Component tests (`mcq-table.test.tsx`):**

1. **Renders column headers** — "Question Name", "Question Text", "Actions"
2. **Renders row data** — given MCQ list prop, name and question text visible
3. **Empty state** — no MCQs → "No questions yet" message
4. **Create button navigates** — click "Create New Question" → router pushes `/dashboard/questions/new`
5. **Actions menu opens** — click ⋮ → menu visible with Edit and Delete
6. **Edit action navigates** — click Edit → router pushes `/dashboard/questions/[id]/edit`
7. **Delete action confirms** — click Delete → confirmation dialog appears
8. **Delete calls API** — confirm delete → `DELETE /api/mcqs/:id` invoked, table refreshes

**Component tests (`mcq-form.test.tsx`):**

1. **Renders 2 default choice rows** on mount
2. **Add choice button** — click append → 3 rows; repeat until 6
3. **Add choice disabled at 6** — 6 rows → add button disabled or hidden
4. **Remove choice** — with 3 rows, remove one → 2 rows; remove disabled at 2 rows
5. **Exactly one correct radio** — selecting radio on row 2 deselects row 1
6. **Save submits payload** — fill form, click Save → `POST` or `PUT` called with correct body
7. **Save disabled while submitting** — loading state prevents double submit
8. **Cancel navigates back** — click Cancel → router pushes `/dashboard`, no API call
9. **Validation errors displayed** — submit with empty name → inline error shown
10. **Edit mode pre-fills** — given `initialData` prop, fields populated

**Dashboard page test (`page.test.tsx`):**

1. **Protected route** — unauthenticated → redirect to `/sign-in` (mock `requireAuth`)
2. **Renders MCQ table** — authenticated → table component present
3. **Logout still available** — logout button present

**E2E criteria (manual or Playwright if adopted):**

1. Sign in → land on dashboard → see questions table
2. Create question with 3 choices → save → appears in table
3. Edit question → change text → save → updated in table
4. Delete question → confirm → removed from table
5. Cancel on create form → returns to dashboard with no new row

**Tasks:**

1. Add shadcn `dropdown-menu` component: `npx shadcn@latest add @shadcn/dropdown-menu`
2. Write failing component tests for `mcq-table` and `mcq-form`
3. Implement `src/components/mcq/mcq-table.tsx` (client component)
4. Implement `src/components/mcq/mcq-form.tsx` (client component)
5. Implement `src/components/mcq/delete-mcq-dialog.tsx` (confirmation dialog)
6. Expand `src/app/dashboard/page.tsx` — server component fetches MCQs, renders table
7. Create `src/app/dashboard/questions/new/page.tsx`
8. Create `src/app/dashboard/questions/[id]/edit/page.tsx`
9. Run `npm run test` — full suite green
10. Run `npm run lint` and `npm run build`

**Deliverables:**

- `src/components/mcq/mcq-table.tsx` + tests
- `src/components/mcq/mcq-form.tsx` + tests
- `src/components/mcq/delete-mcq-dialog.tsx`
- Expanded `src/app/dashboard/page.tsx` + tests
- `src/app/dashboard/questions/new/page.tsx` + tests
- `src/app/dashboard/questions/[id]/edit/page.tsx` + tests
- Green Phase 3 test suite

---

## Technical Implementation Details

### Key Files

| File | Purpose |
|------|---------|
| `migrations/0002_create_mcq_tables.sql` | D1 schema for MCQ module |
| `src/lib/validations/mcq.ts` | Zod schemas for create, update, attempt payloads |
| `src/lib/services/mcq.ts` | `MCQService` — all business logic and D1 transactions |
| `src/lib/api/auth.ts` | `requireApiAuth()` for route handlers |
| `src/app/api/mcqs/route.ts` | GET (list), POST (create) |
| `src/app/api/mcqs/[id]/route.ts` | GET (one), PUT (update), DELETE |
| `src/app/api/mcqs/[id]/attempts/route.ts` | POST (record attempt) |
| `src/components/mcq/mcq-table.tsx` | Dashboard table with actions dropdown |
| `src/components/mcq/mcq-form.tsx` | Shared create/edit form |
| `src/app/dashboard/page.tsx` | Expanded protected dashboard |
| `src/app/dashboard/questions/new/page.tsx` | Create question page |
| `src/app/dashboard/questions/[id]/edit/page.tsx` | Edit question page |

### Implementation Patterns

**Service layer (follows Sprint 1 `user.ts` / `session.ts` conventions):**

```typescript
// src/lib/services/mcq.ts
import { getDb } from "@/lib/db";
import { createMcqSchema, type CreateMcqInput } from "@/lib/validations/mcq";

export async function createMcq(userId: string, input: CreateMcqInput) {
  const parsed = createMcqSchema.parse(input);
  const db = await getDb();

  // Use batch() for atomic mcq + choices insert
  await db.batch([
    db.prepare("INSERT INTO mcq (name, question, created_by_user_id) VALUES (?1, ?2, ?3)")
      .bind(parsed.name, parsed.question, userId),
  // ... choice inserts
  ]);

  return getMcqById(mcqId);
}
```

**API route handler (thin transport layer):**

```typescript
// src/app/api/mcqs/route.ts
import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api/auth";
import { createMcq, listMcqs } from "@/lib/services/mcq";

export async function POST(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof Response) return auth;

  const body = await request.json();
  try {
    const data = await createMcq(auth.id, body);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    // Map Zod and service errors to 400/409/500
  }
}
```

**Dashboard server component (auth gate + data fetch):**

```typescript
// src/app/dashboard/page.tsx
import { requireAuth } from "@/lib/auth/current-user";
import { McqTable } from "@/components/mcq/mcq-table";

export default async function DashboardPage() {
  const user = await requireAuth();
  // Fetch MCQs server-side or pass fetch URL to client table
  return (/* expanded layout with McqTable */);
}
```

### Important Notes

- **D1 placeholders:** Always use numbered placeholders (`?1`, `?2`). Never mix with anonymous `?`.
- **D1 `all()` over `first()`:** Read `results[0]` from `all()` for consistent local/remote behavior.
- **SQLite booleans:** Store as `INTEGER` 0/1; convert to `boolean` in TypeScript service types.
- **Choice sync on update:** If `mcq_attempts` exist, deleting old choices violates `ON DELETE RESTRICT` on `selected_choice_id`. The service must detect this and return a `409` with a clear message, or use an upsert strategy that preserves referenced choice rows.
- **`npm run preview`:** Verify API routes and auth under the Workers runtime, not only `npm run dev`.
- **No new dependencies without approval** except shadcn components (dropdown-menu) added via CLI.

---

## Acceptance Criteria

### Phase 1 — Database & Service

- [x] Migration `0002_create_mcq_tables.sql` applies cleanly with `--local`
- [x] All Phase 1 unit tests pass (`mcq.test.ts`, `mcq.persistence.test.ts`)
- [x] Creating an MCQ with fewer than 2 or more than 6 choices throws a validation error
- [x] Creating an MCQ without exactly one correct choice throws a validation error
- [x] Deleting an MCQ cascades to `mcq_choices` and `mcq_attempts`
- [x] `recordAttempt` sets `is_correct` based on the selected choice's `is_correct` flag

### Phase 2 — API

- [ ] All five API endpoints are implemented and covered by contract tests
- [ ] Unauthenticated requests to any `/api/mcqs/**` endpoint return 401
- [ ] `POST /api/mcqs` with invalid payload returns 400 with structured error body
- [ ] `POST /api/mcqs/:id/attempts` rejects a `selected_choice_id` that does not belong to the MCQ
- [ ] Route handlers contain no direct SQL — all logic delegated to `MCQService`
- [ ] `npm run build` succeeds

### Phase 3 — UI

- [ ] Dashboard displays a table with Question Name, Question Text, and Actions columns
- [ ] Actions dropdown offers Edit and Delete for each row
- [ ] "Create New Question" button navigates to the create form
- [ ] Create/edit form shows 2 choices by default, allows adding up to 6, prevents removing below 2
- [ ] Save submits to the API and redirects to dashboard on success
- [ ] Cancel returns to dashboard without persisting
- [ ] All Phase 3 component tests pass
- [ ] `npm run lint` passes
- [ ] MCQ flows work under `npm run preview` (Workers runtime)

---

## Success Metrics

| Metric | Target | How Measured |
|--------|--------|--------------|
| Phase 1 test pass rate | 100% | `npm run test` for schema/service tests |
| Phase 2 API test pass rate | 100% | `npm run test` for route contract tests |
| Phase 3 component test pass rate | 100% | `npm run test` for UI tests |
| MCQ create-to-list latency | < 2s local | Manual timing from Save click to table refresh |
| Auth enforcement | 0 unauthenticated CRUD successes | API tests assert 401 without session |
| Choice validation coverage | 100% of 2–6 boundary cases tested | Unit test count for boundary scenarios |
| Workers runtime parity | All CRUD flows pass in preview | Manual QA with `npm run preview` |

---

## Dependencies

### External Dependencies

- **Cloudflare D1** — persistence for `mcq`, `mcq_choices`, `mcq_attempts` (binding `DB`, already configured from Sprint 1)
- **Vitest + Testing Library** — test runner (already installed from Sprint 1)
- **shadcn/ui `dropdown-menu`** — actions column dropdown (to be added via CLI)

### Internal Dependencies

| Module | Purpose |
|--------|---------|
| `src/lib/db.ts` | `getDb()` D1 accessor |
| `src/lib/auth/current-user.ts` | `requireAuth()`, `getCurrentUser()` for pages |
| `src/lib/auth/constants.ts` | `SESSION_COOKIE_NAME` |
| `src/lib/services/session.ts` | Session validation for API auth |
| `src/lib/services/user.ts` | `PublicUser` type, user lookup |
| `migrations/0001_create_auth_tables.sql` | Existing `users` table (FK target) |
| `src/components/ui/*` | shadcn primitives (table, button, field, input, dialog) |

---

## Risks and Mitigation

### Technical Risks

- **Risk:** Choice replacement on update conflicts with existing `mcq_attempts` FK constraints.
- **Mitigation:** Service detects attempts before choice delete; return `409 CONFLICT` with actionable message. Document in UI that questions with attempts cannot have choices restructured (wording change only if no attempt references affected choices).

- **Risk:** API routes behave differently on Node dev vs Cloudflare Workers preview.
- **Mitigation:** Run `npm run preview` before marking sprint complete; add preview verification to acceptance criteria.

- **Risk:** D1 `batch()` partial failure leaves inconsistent state.
- **Mitigation:** Wrap create/update in `db.batch()`; write atomicity tests in `mcq.persistence.test.ts`.

- **Risk:** Test suite mocks diverge from real D1 behavior (FK enforcement, CASCADE).
- **Mitigation:** Complement mocked unit tests with at least one local migration apply + manual smoke test; consider `@cloudflare/vitest-pool-workers` only if user approves new dependency.

### User Experience Risks

- **Risk:** Truncated question text in table hides critical context.
- **Mitigation:** Truncate with tooltip or expand on hover showing full `question` text.

- **Risk:** Delete confirmation not shown → accidental data loss.
- **Mitigation:** Require explicit confirmation dialog before `DELETE`; test in component suite.

- **Risk:** Users confused about single-answer radio vs checkbox.
- **Mitigation:** Label the correct-answer control "Correct answer (select one)" with `FieldDescription`.

---

## Troubleshooting Guide

### Migration apply fails with FK error

**Problem:** `0002_create_mcq_tables.sql` fails to apply.
**Cause:** `users` table missing or migration 0001 not applied.
**Solution:** Run `npx wrangler d1 migrations apply <db-name> --local` starting from 0001.
**Code Reference:** `migrations/0001_create_auth_tables.sql`

### API returns 401 despite being signed in

**Problem:** Fetch from client component to `/api/mcqs` returns 401.
**Cause:** `fetch` called without `credentials: "include"`, so session cookie not sent.
**Solution:** Use `fetch(url, { credentials: "include" })` in all client-side API calls.

### Update MCQ returns 409

**Problem:** `PUT /api/mcqs/:id` fails with conflict.
**Cause:** Existing attempts reference choice rows that the update tries to delete.
**Solution:** Edit question text/name only, or delete attempts first (future admin feature). For v1, create a new MCQ instead of restructuring choices.

### Tests fail on `getCloudflareContext`

**Problem:** Service tests throw when importing `getDb`.
**Cause:** Cloudflare context unavailable in jsdom.
**Solution:** Mock `@opennextjs/cloudflare` per `src/lib/services/persistence.test.ts` pattern.

---

## Notes for AI Agents

When working with this PRD:

1. Start by reading **Overview/Problem** and **Hypothesis** to understand intent.
2. Use **Scope (In/Out/Cut)** to determine boundaries — do not build quiz assembly, roles, or learner UI.
3. Follow **TDA strictly**: write failing tests for the current phase before implementation.
4. Keep business logic in `MCQService`; route handlers are thin HTTP adapters.
5. Reuse Sprint 1 patterns: `getDb()`, Zod validation, `requireAuth`, shadcn/ui, `@/` imports.
6. Update phase status markers (`PLANNED` → `IN PROGRESS` → `COMPLETED`) as work progresses.
7. Mark acceptance criteria complete only when tests pass and `npm run build` succeeds.
8. Add troubleshooting entries when bugs are found and fixed.
9. Do not apply migrations to the remote database.
10. Do not run `npm run deploy` unless explicitly asked.

---

## Current Status

**Last Updated:** September 4, 2026
**Current Phase:** Phase 2 — Services & API Endpoint Layers
**Status:** PLANNED (Phase 1 complete)
**Next Steps:** Write failing API contract tests, then implement `/api/mcqs` route handlers
