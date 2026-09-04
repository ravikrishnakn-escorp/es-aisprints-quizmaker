Date created: August 25, 2026
Date last modified: September 4, 2026

# Quiz Maker Technical PRD

## Project Overview

Quiz Maker is a web application that will eventually allow users to create quizzes, manage quizzes, attempt quizzes, and view quiz results. The long-term product is a full quiz lifecycle platform for educators, trainers, and learners.

This document defines the **authentication module only**. It is the foundation for all future features. No quiz-related functionality is included in this sprint.

The application is built on the AISprints starter stack:

- Next.js 16 with the App Router and React 19
- Cloudflare Workers via OpenNext
- Tailwind CSS v4 and shadcn/ui
- TypeScript in strict mode
- Wrangler for Cloudflare configuration and deployment

At the time of this PRD, no database, authentication library, or session store is installed. Implementation details for persistence and session handling will be decided during the development sprint, within the constraints defined here.

---

## Business Goal

We need a secure, reliable way for users to register, sign in, and maintain an authenticated session before any quiz functionality can be built. Authentication establishes user identity, protects future quiz data, and creates a trustworthy entry point to the application.

**We believe that** providing a simple, secure sign-up and sign-in experience **will** give users confidence in the platform and **will** enable all future Quiz Maker features to be scoped to authenticated users.

---

## Sprint Goal

**Sprint 0 goal:** Fully define and document the authentication feature before development begins.

Sprint 0 covers only:

- User sign up
- User sign in
- Logout
- User session management
- Protected routes
- The basic authentication flow

Sprint 0 does **not** include implementation. The deliverable is this Technical PRD.

---

## Hypothesis

We believe that email-and-password authentication with session-based access control will provide sufficient security and usability for the initial Quiz Maker release, while keeping complexity manageable for a teaching-focused sprint environment.

---

## Scope

### In Scope

- Sign-up page with full name, email, password, and confirm password
- Sign-in page with email and password
- Logout functionality
- Session management (authenticated state persists until logout)
- Protected routes (dashboard and any other authenticated pages)
- Redirect behavior for unauthenticated and authenticated users
- Client-side and server-side validation rules as defined in this document
- Error and success messaging for all authentication actions
- Security, performance, accessibility, and responsive design requirements for the auth module

### Out of Scope

See the dedicated **Out of Scope** section below.

### Cut

The following were considered but deliberately excluded from Sprint 0:

- **Social login (Google, GitHub, etc.)** — Adds OAuth complexity; email/password is sufficient for the first sprint.
- **Email verification** — Requires email delivery infrastructure; deferred to a future enhancement.
- **Password reset / forgot password** — Requires email delivery and token management; deferred.
- **Multi-factor authentication (MFA)** — Not required for initial release.
- **Role-based access control (admin vs. user)** — All authenticated users have the same access in this sprint; roles can be added when quiz ownership is introduced.
- **Account profile editing** — Not part of authentication; deferred.
- **Remember me / extended sessions** — Standard session until logout is sufficient for v1.

---

## User Flow

### New user (sign up)

1. User navigates to the Sign Up page.
2. User enters full name, email, password, and confirm password.
3. User submits the form.
4. System validates all fields.
5. If validation fails, inline errors are shown; user corrects and resubmits.
6. If the email is already registered, an error is shown.
7. On success, the user sees a success message and is redirected to the Sign In page.
8. User signs in with their new credentials.

### Returning user (sign in)

1. User navigates to the Sign In page.
2. User enters email and password.
3. User submits the form.
4. System validates credentials.
5. If credentials are invalid, a meaningful error message is displayed.
6. On success, a session is created and the user is redirected to the Dashboard.
7. Session persists across page navigation and browser refresh until logout.

### Authenticated user

1. User can access protected pages (e.g., Dashboard).
2. User can navigate within the authenticated area without re-entering credentials.
3. User can log out from any authenticated page.

### Unauthenticated user accessing protected content

1. User attempts to access a protected page directly (e.g., via bookmark or URL).
2. System detects no valid session.
3. User is redirected to the Sign In page.

### Logout

1. User clicks Logout.
2. Session is cleared.
3. User is redirected to the Sign In page.
4. User cannot access protected pages without signing in again.

---

## User Stories

| ID | As a… | I want to… | So that… |
|----|--------|------------|----------|
| US-01 | New user | Register with my name, email, and password | I can create a Quiz Maker account |
| US-02 | New user | See clear validation errors during sign up | I can fix my input before submitting again |
| US-03 | New user | Be told if my email is already registered | I know to sign in instead or use a different email |
| US-04 | New user | Be redirected to Sign In after successful registration | I can log in with my new account |
| US-05 | Returning user | Sign in with my email and password | I can access my account |
| US-06 | Returning user | See a meaningful error when my credentials are wrong | I understand why sign in failed without exposing sensitive details |
| US-07 | Authenticated user | Stay signed in while using the app | I do not have to re-enter credentials on every page |
| US-08 | Authenticated user | Access the Dashboard and other protected pages | I can use authenticated features |
| US-09 | Authenticated user | Log out | My session ends and my account is protected on shared devices |
| US-10 | Unauthenticated user | Be redirected to Sign In when I visit a protected page | I am guided to authenticate before accessing restricted content |

---

## Functional Requirements

### FR-01: Sign Up

- The application must provide a Sign Up page.
- The form must collect: Full Name, Email Address, Password, Confirm Password.
- All fields are required.
- Validation rules must be enforced before account creation (see Field Validation Rules).
- The email address must be unique across all registered users.
- Passwords must be stored securely (hashed; never stored or logged in plain text).
- On successful registration, the user must be redirected to the Sign In page.
- A success message must be shown before or during redirect.

### FR-02: Sign In

- The application must provide a Sign In page.
- The form must collect: Email Address, Password.
- Both fields are required.
- The system must validate credentials against stored user records.
- On invalid credentials, a meaningful error message must be displayed.
- On successful sign in, an authenticated session must be created.
- On successful sign in, the user must be redirected to the Dashboard.
- The session must persist until the user logs out or the session expires per security policy.

### FR-03: Logout

- Authenticated users must be able to log out from the application.
- Logout must clear the authenticated session completely.
- After logout, the user must be redirected to the Sign In page.
- After logout, protected pages must no longer be accessible without signing in again.

### FR-04: Session Management

- The application must maintain an authenticated session for signed-in users.
- Session state must survive page navigation within the app.
- Session state must survive browser refresh while the session is valid.
- Session validation must occur on the server for protected routes and sensitive actions.
- Client-side session indicators alone are not sufficient for authorization.

### FR-05: Protected Routes

- The Dashboard and any other authenticated pages must require a valid session.
- Unauthenticated users attempting to access protected routes must be redirected to the Sign In page.
- Authenticated users who visit Sign Up or Sign In may be redirected to the Dashboard (optional but recommended to avoid confusion).

### FR-06: Error Handling

- All validation errors must be displayed clearly at the field level where applicable.
- Authentication failures must use generic messaging that does not reveal whether an email exists in the system (except where uniqueness is explicitly required on sign up).
- The application must handle unexpected errors gracefully with a user-friendly message.

---

## Non-Functional Requirements

### Security

- Passwords must never be stored in plain text.
- Passwords must never appear in logs, URLs, or client-side storage.
- Sessions must be protected against common attacks (see Security Requirements).
- All authentication actions must be validated on the server.
- Sensitive operations must not rely solely on client-side checks.

### Performance

- Sign up and sign in form submission should provide user feedback (loading state) within one interaction cycle.
- Authentication checks for protected routes should not cause noticeable delay on navigation under normal conditions.
- Session validation should be efficient and not require redundant full credential checks on every page load where a lighter session lookup suffices.

### Scalability

- Authentication design should support growth in user count without architectural rework.
- Session and user storage approach should be compatible with Cloudflare Workers and serverless execution.
- The auth module should be isolated enough that persistence or session strategy can evolve without rewriting UI flows.

### Accessibility

- All form fields must have associated labels.
- Error messages must be programmatically associated with their fields.
- The auth pages must be keyboard navigable (tab order, submit via keyboard).
- Color must not be the only indicator of errors or success.
- Focus management should be sensible after form submission errors.

### Responsive Design

- Sign Up and Sign In pages must be usable on mobile, tablet, and desktop viewports.
- Forms must remain readable and tappable on small screens without horizontal scrolling.
- Layout should adapt gracefully from narrow to wide screens.

### Maintainability

- Authentication logic should be centralized rather than duplicated across pages.
- Validation rules should be defined in one authoritative place and applied consistently.
- Error messages should be defined in one place to avoid drift between UI and server validation.

### Clean Architecture

- UI pages should not contain business logic for credential verification or session creation.
- Authentication concerns (validation, credential check, session create/destroy, route protection) should be separated from presentation.
- The auth module should expose clear boundaries so future features (quizzes, attempts) can depend on "current user" without reimplementing auth.

---

## UI Requirements

### Pages

| Page | Route (suggested) | Purpose | Access |
|------|-------------------|---------|--------|
| Sign Up | `/sign-up` | New user registration | Public |
| Sign In | `/sign-in` | Existing user login | Public |
| Dashboard | `/dashboard` | Post-login landing page | Protected |

Additional protected routes may be added later; they must follow the same protection rules as the Dashboard.

### Sign Up Page

**Purpose:** Allow new users to create an account.

**Layout elements:**

- Page title (e.g., "Create your account")
- Sign Up form with all required fields
- Link to Sign In for users who already have an account
- Primary submit button (e.g., "Sign Up" or "Create Account")
- Loading/disabled state on submit while processing
- Field-level error display
- Success feedback before redirect to Sign In

### Sign In Page

**Purpose:** Allow existing users to authenticate.

**Layout elements:**

- Page title (e.g., "Sign in to Quiz Maker")
- Sign In form with email and password
- Link to Sign Up for new users
- Primary submit button (e.g., "Sign In")
- Loading/disabled state on submit while processing
- Form-level or field-level error display for invalid credentials
- Logout is not on this page; it appears in authenticated areas only

### Dashboard (protected placeholder)

**Purpose:** Confirm successful authentication and serve as the post-login destination.

**Layout elements:**

- Clear indication the user is signed in (e.g., welcome message using the user's name)
- Logout control
- Minimal placeholder content is acceptable for this sprint; quiz features are out of scope

### Visual and UX standards

- Use existing project design system (Tailwind CSS v4, shadcn/ui components, theme tokens).
- Forms should use consistent spacing, typography, and button styles across Sign Up and Sign In.
- Destructive/error states should use theme-appropriate error styling.
- Pages should feel cohesive with the rest of the Quiz Maker application.

---

## Input Fields

### Sign Up

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Full Name | Text | Yes | User's display name |
| Email Address | Email | Yes | Used as unique login identifier |
| Password | Password | Yes | Masked input |
| Confirm Password | Password | Yes | Must match Password |

### Sign In

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Email Address | Email | Yes | Must match registered email |
| Password | Password | Yes | Masked input |

---

## Field Validation Rules

### Sign Up

| Field | Rule | Applies on |
|-------|------|------------|
| Full Name | Required; must not be empty or whitespace-only | Client and server |
| Email Address | Required | Client and server |
| Email Address | Must be valid email format | Client and server |
| Email Address | Must be unique (not already registered) | Server |
| Password | Required | Client and server |
| Password | Minimum 8 characters | Client and server |
| Password | At least one uppercase letter (A–Z) | Client and server |
| Password | At least one lowercase letter (a–z) | Client and server |
| Password | At least one number (0–9) | Client and server |
| Password | At least one special character | Client and server |
| Confirm Password | Required | Client and server |
| Confirm Password | Must exactly match Password | Client and server |

**Special character definition:** Any non-alphanumeric character (e.g., `! @ # $ % ^ & * ( ) - _ + = [ ] { } ; : ' " , . < > ? / \ | ~`).

### Sign In

| Field | Rule | Applies on |
|-------|------|------------|
| Email Address | Required | Client and server |
| Email Address | Must be valid email format | Client and server |
| Password | Required | Client and server |
| Credentials | Email and password combination must match a registered user | Server |

---

## Error Messages

Messages should be clear, concise, and user-friendly. Wording may be adjusted for tone, but meaning must be preserved.

### Sign Up — field validation

| Condition | Message |
|-----------|---------|
| Full name empty | "Full name is required." |
| Email empty | "Email address is required." |
| Email invalid format | "Please enter a valid email address." |
| Email already registered | "An account with this email already exists. Please sign in." |
| Password empty | "Password is required." |
| Password too short | "Password must be at least 8 characters." |
| Password missing uppercase | "Password must contain at least one uppercase letter." |
| Password missing lowercase | "Password must contain at least one lowercase letter." |
| Password missing number | "Password must contain at least one number." |
| Password missing special character | "Password must contain at least one special character." |
| Confirm password empty | "Please confirm your password." |
| Passwords do not match | "Passwords do not match." |

### Sign Up — general

| Condition | Message |
|-----------|---------|
| Unexpected server failure | "Something went wrong. Please try again." |

### Sign In

| Condition | Message |
|-----------|---------|
| Email empty | "Email address is required." |
| Email invalid format | "Please enter a valid email address." |
| Password empty | "Password is required." |
| Invalid credentials | "Invalid email or password." |
| Unexpected server failure | "Something went wrong. Please try again." |

**Note:** Sign-in errors for invalid credentials must not reveal whether the email exists. Use the single generic message: "Invalid email or password."

---

## Success Messages

| Action | Message | Follow-up |
|--------|---------|-----------|
| Sign Up successful | "Account created successfully. Please sign in." | Redirect to Sign In |
| Sign In successful | Optional brief confirmation or immediate redirect | Redirect to Dashboard |
| Logout successful | Optional brief confirmation or immediate redirect | Redirect to Sign In |

Success messaging may be shown as an inline banner, toast, or query parameter on the destination page. The redirect behavior is mandatory; the exact presentation is flexible.

---

## Navigation Flow

```
Public entry
    │
    ├── Sign Up (/sign-up)
    │       └── Success → Sign In (/sign-in)
    │
    └── Sign In (/sign-in)
            └── Success → Dashboard (/dashboard)

Dashboard (/dashboard) [Protected]
    └── Logout → Sign In (/sign-in)

Protected route (any)
    └── Unauthenticated access → Sign In (/sign-in)

Sign In / Sign Up (optional)
    └── Already authenticated → Dashboard (/dashboard)
```

### Navigation links

| From | Link | To |
|------|------|-----|
| Sign Up | "Already have an account? Sign in" | Sign In |
| Sign In | "Don't have an account? Sign up" | Sign Up |
| Dashboard | Logout | Sign In (after session cleared) |

---

## Authentication Flow

### Registration flow

1. User submits Sign Up form.
2. Client validates all fields per Field Validation Rules.
3. If client validation fails, show field errors; stop.
4. Server receives registration request.
5. Server re-validates all fields (never trust client-only validation).
6. Server checks email uniqueness.
7. Server securely hashes password and persists user record.
8. Server returns success.
9. Client shows success message and redirects to Sign In.

### Sign-in flow

1. User submits Sign In form.
2. Client validates required fields and email format.
3. If client validation fails, show field errors; stop.
4. Server receives sign-in request.
5. Server re-validates input.
6. Server looks up user by email and verifies password against stored hash.
7. If invalid, return generic "Invalid email or password" error.
8. If valid, create authenticated session bound to the user.
9. Client redirects to Dashboard.

### Session lifecycle

1. Session is created on successful sign in.
2. Session identifier is stored in a secure, HTTP-only cookie (or equivalent secure mechanism compatible with Cloudflare Workers).
3. Each request to a protected route validates the session on the server.
4. Valid session → allow access.
5. Invalid or missing session → redirect to Sign In.
6. Session remains active until logout or expiration per security policy.

### Logout flow

1. User initiates logout.
2. Server invalidates/destroys the session.
3. Session cookie is cleared.
4. User is redirected to Sign In.
5. Subsequent access to protected routes requires new sign in.

### Protected route flow

1. User requests a protected page.
2. Server checks for valid session before rendering or returning content.
3. If valid → render page.
4. If invalid → redirect to Sign In (optionally preserving intended destination for post-login redirect in a future enhancement).

---

## Security Requirements

### Password security

- Passwords must be hashed using a modern, adaptive hashing algorithm suitable for password storage.
- Plain-text passwords must never be stored, logged, or transmitted in URLs.
- Password fields must use masked input.

### Session security

- Session tokens must be unpredictable and securely generated.
- Session cookies must be HTTP-only to reduce XSS token theft risk.
- Session cookies must use appropriate SameSite policy.
- Secure flag must be enabled in production (HTTPS).
- Sessions must be invalidated on logout.

### Transport and data handling

- Authentication must occur over HTTPS in production.
- User input must be validated and sanitized on the server.
- Authentication errors must not expose internal system details to the user.

### Brute-force and abuse mitigation

- Sign-in failures should use generic error messaging.
- Rate limiting or throttling on sign-in attempts is recommended where practical (implementation detail deferred to development sprint).

### Authorization

- Protected routes must enforce authentication on the server, not only in the UI.
- Client-side route hiding is not sufficient protection.

### Compliance with project constraints

- Secrets (session signing keys, etc.) must be stored in `.dev.vars` locally and Wrangler secrets in production.
- Secrets must never be committed to the repository.

---

## Acceptance Criteria

### Sign Up

- [x] A user can open the Sign Up page and see all required fields: Full Name, Email, Password, Confirm Password.
- [x] Submitting with any empty required field shows the appropriate field error.
- [x] Submitting with an invalid email format shows "Please enter a valid email address."
- [x] Submitting with a password shorter than 8 characters shows the appropriate error.
- [x] Submitting with a password missing uppercase, lowercase, number, or special character shows the appropriate error.
- [x] Submitting with mismatched password and confirm password shows "Passwords do not match."
- [x] Submitting with an email that is already registered shows "An account with this email already exists. Please sign in."
- [x] Successful registration shows a success message and redirects to the Sign In page.
- [x] After registration, the user can sign in with the credentials they created.

### Sign In

- [x] A user can open the Sign In page and see Email and Password fields.
- [x] Submitting with empty fields shows appropriate validation errors.
- [x] Submitting with invalid credentials shows "Invalid email or password."
- [x] Submitting with valid credentials creates a session and redirects to the Dashboard.
- [x] After sign in, refreshing the browser keeps the user authenticated.
- [x] After sign in, navigating to the Dashboard does not require signing in again.

### Logout

- [x] An authenticated user can log out from the Dashboard (or authenticated layout).
- [x] After logout, the session is cleared and the user is redirected to Sign In.
- [x] After logout, accessing the Dashboard redirects to Sign In.

### Protected routes

- [x] An unauthenticated user who navigates directly to `/dashboard` is redirected to Sign In.
- [x] An authenticated user can access `/dashboard`.
- [x] Protected route enforcement occurs on the server, not only by hiding links in the UI.

### Non-functional

- [x] Sign Up and Sign In pages are usable on mobile and desktop viewports.
- [x] Form fields have visible labels and accessible error associations.
- [x] Passwords are not visible in browser network logs as plain text in URLs.
- [x] Authentication flows work under the Cloudflare Workers runtime (`npm run preview`), not only under Node dev mode.

---

## Assumptions

- Users will authenticate with email and password only; no social login in this sprint.
- One account per unique email address.
- The Dashboard is a minimal protected landing page; quiz features come in later sprints.
- A persistent user store will be added during implementation (e.g., Cloudflare D1), compatible with the Workers runtime.
- Session management will use a server-side approach compatible with Next.js App Router and Cloudflare Workers.
- English is the only language for UI copy in this sprint.
- Users are responsible for remembering their password; password reset is out of scope.
- All authenticated users have equal access in this sprint; no roles or permissions yet.
- The project follows existing AISprints conventions: Server Actions for form mutations, Zod for validation, shadcn/ui for form UI.

---

## Out of Scope

The following are explicitly **not** part of Sprint 0 or the authentication sprint:

- Quiz creation, editing, or deletion
- Quiz management (lists, folders, publishing)
- Quiz attempts or taking a quiz
- Quiz results, scoring, or reporting
- Email verification after sign up
- Password reset / forgot password
- Social or OAuth login
- Multi-factor authentication
- User profile management (avatar, bio, settings)
- Admin panel or role-based access control
- Account deletion or deactivation
- Audit logging of authentication events
- "Remember me" / long-lived sessions beyond standard session policy
- Internationalization (i18n)
---

## Future Enhancements
These may be addressed in later sprints after core authentication is stable:

| Enhancement | Rationale |
|-------------|-----------|
| Email verification | Confirm email ownership before full access |
| Forgot password / reset flow | Recover access without support intervention |
| Social login (Google, etc.) | Reduce friction for new users |
| Multi-factor authentication | Stronger account security |
| Role-based access (teacher, student, admin) | Support quiz ownership and permissions |
| Session management page (view/revoke sessions) | Security-conscious users |
| Post-login redirect to originally requested URL | Better UX after forced sign in |
| Account settings (change password, update name) | Self-service profile management |
| Rate limiting and CAPTCHA on auth endpoints | Stronger abuse protection |
| Auth event audit log | Security monitoring and compliance |

---

## Risks and Open Questions

### Technical risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Auth behavior differs between Node dev and Cloudflare Workers | Bugs found only at deploy/preview time | Verify auth flows with `npm run preview` before considering sprint complete |
| Session handling on edge/serverless | Session invalidation or cookie issues | Choose a session strategy tested on Workers; centralize session logic |
| No database configured yet | Delay in implementation start | Create D1 (or chosen store) early in implementation sprint; follow project D1 conventions |
| Password hashing library compatibility with Workers | Runtime errors on hash/verify | Select a hashing approach verified on Cloudflare Workers before implementation |

### User experience risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Strict password rules frustrate users | Abandonment at sign up | Show password requirements clearly on Sign Up; validate inline where possible |
| No password reset | Locked-out users cannot recover | Document as known limitation; prioritize in future sprint |
| Generic sign-in error may confuse users | Support burden | Keep message clear; link to Sign Up for new users |

### Open questions

| # | Question | Owner | Status |
|---|----------|-------|--------|
| OQ-01 | What session expiration duration should apply (e.g., 24 hours, 7 days, browser session)? | Product / dev team | Open |
| OQ-02 | Should authenticated users visiting `/sign-in` or `/sign-up` be auto-redirected to Dashboard? | Product | Open (recommended: yes) |
| OQ-03 | Should the post-login redirect preserve the originally requested protected URL? | Product | Open (defer to future enhancement unless required now) |
| OQ-04 | What is the exact special-character set for password validation messaging? | Dev team | Open (defined in this PRD as non-alphanumeric; confirm in implementation) |
| OQ-05 | Is rate limiting required for v1 or acceptable as a follow-up? | Product / security | Open |

---

## Success Metrics

| Metric | Target | How measured |
|--------|--------|--------------|
| Sign-up completion rate | Users who submit valid sign-up reach Sign In | Funnel: Sign Up submit → redirect success |
| Sign-in success rate | Valid credentials reach Dashboard | Sign In submit → Dashboard load |
| Auth-related defect rate | Zero critical auth bugs at sprint end | Manual QA + acceptance criteria checklist |
| Protected route enforcement | 100% of unauthenticated Dashboard access attempts redirect to Sign In | Manual QA |
| Cross-runtime parity | Auth works in preview (Workers) same as dev | `npm run preview` verification |

---

## Dependencies

### External dependencies

- Cloudflare account and Wrangler (for deployment and preview)
- HTTPS in production (Cloudflare)

### Internal dependencies

- AISprints starter project (Next.js, OpenNext, Tailwind, shadcn/ui)
- Persistent user storage (to be provisioned during implementation)
- Session signing secret (local: `.dev.vars`; production: Wrangler secret)
- Validation library (Zod, per project conventions — to be added during implementation)
- Password hashing capability (to be selected during implementation)

### Environment variables (conceptual)

| Variable | Purpose |
|----------|---------|
| Session secret | Sign and verify session tokens |
| Additional auth-related secrets | As required by chosen implementation |

Exact variable names will be documented in `.dev.vars.example` during implementation.

---

## Implementation Phases

*For the development sprint following Sprint 0. Status applies once implementation begins.*

### Phase 1: Foundation — COMPLETED

**Objective:** Establish persistence and auth infrastructure.

**Tasks:**
1. Provision user storage
2. Define user record fields (name, email, password hash, timestamps)
3. Configure session secret and environment variables
4. Implement password hashing and verification utilities
5. Implement session create, validate, and destroy logic

**Deliverables:**
- Working user registration persistence
- Working session management
- Environment configuration documented

### Phase 2: Sign Up and Sign In UI — COMPLETED

**Objective:** Build public auth pages with full validation and messaging.

**Tasks:**
1. Build Sign Up page with all fields and validation
2. Build Sign In page with validation and error handling
3. Wire forms to server-side auth actions
4. Implement success and error messages per this PRD
5. Implement navigation links between Sign Up and Sign In

**Deliverables:**
- Functional Sign Up flow with redirect to Sign In
- Functional Sign In flow with redirect to Dashboard

### Phase 3: Protected Routes and Logout — COMPLETED

**Objective:** Enforce authentication across the app.

**Tasks:**
1. Create Dashboard placeholder page
2. Implement route protection for authenticated pages
3. Implement logout
4. Handle unauthenticated redirect to Sign In
5. Optional: redirect authenticated users away from auth pages

**Deliverables:**
- Protected Dashboard accessible only when signed in
- Logout clears session and redirects to Sign In

### Phase 4: Verification — COMPLETED

**Objective:** Confirm auth module meets acceptance criteria.

**Tasks:**
1. Run through all acceptance criteria manually
2. Verify responsive layout and accessibility basics
3. Verify auth under `npm run preview` (Workers runtime)
4. Run lint and build
5. Add automated test suite with Vitest covering all four implementation phases
6. Run `npm run test` and record results in this PRD

**Deliverables:**
- All acceptance criteria checked
- Auth module ready for quiz features in subsequent sprints
- Automated test suite (54 tests across 10 files) passing via `npm run test`

---

---

## Automated Test Suite

**Framework:** Vitest with Testing Library (jsdom)  
**Run command:** `npm run test`  
**Last run:** September 4, 2026 — **54 tests passed** across 10 test files

Tests are colocated with the code they verify. They mock external boundaries (D1, cookies, navigation) and do not change application behavior.

### Phase 1: Foundation

| Test ID | Scenario | File | Status |
|---------|----------|------|--------|
| T1-01 | Password hashing produces `salt:hash` format | `src/lib/services/password.test.ts` | Pass |
| T1-02 | Correct password verifies against stored hash | `src/lib/services/password.test.ts` | Pass |
| T1-03 | Incorrect password is rejected | `src/lib/services/password.test.ts` | Pass |
| T1-04 | Malformed stored hash is rejected | `src/lib/services/password.test.ts` | Pass |
| T1-05 | User created with normalized email | `src/lib/services/persistence.test.ts` | Pass |
| T1-06 | Password stored as hash, not plain text | `src/lib/services/persistence.test.ts` | Pass |
| T1-07 | Duplicate email throws `EMAIL_ALREADY_EXISTS` | `src/lib/services/persistence.test.ts` | Pass |
| T1-08 | User lookup is case-insensitive | `src/lib/services/persistence.test.ts` | Pass |
| T1-09 | Missing user returns null | `src/lib/services/persistence.test.ts` | Pass |
| T1-10 | Session created for authenticated user | `src/lib/services/persistence.test.ts` | Pass |
| T1-11 | Valid session returns public user | `src/lib/services/persistence.test.ts` | Pass |
| T1-12 | Unknown session returns null | `src/lib/services/persistence.test.ts` | Pass |
| T1-13 | Expired session is removed | `src/lib/services/persistence.test.ts` | Pass |
| T1-14 | Session destroyed on logout | `src/lib/services/persistence.test.ts` | Pass |
| T1-15 | Valid credentials authenticate user | `src/lib/services/persistence.test.ts` | Pass |
| T1-16 | Unknown email returns null | `src/lib/services/persistence.test.ts` | Pass |
| T1-17 | Invalid password returns null | `src/lib/services/persistence.test.ts` | Pass |
| T1-18 | Session cookie is HTTP-only with correct options | `src/lib/auth/current-user.test.ts` | Pass |
| T1-19 | Session cookie cleared on logout | `src/lib/auth/current-user.test.ts` | Pass |

### Phase 2: Sign Up and Sign In UI

| Test ID | Scenario | File | Status |
|---------|----------|------|--------|
| T2-01 | Sign-up accepts valid input | `src/lib/validations/auth.test.ts` | Pass |
| T2-02 | Sign-up requires full name | `src/lib/validations/auth.test.ts` | Pass |
| T2-03 | Sign-up requires email | `src/lib/validations/auth.test.ts` | Pass |
| T2-04 | Sign-up rejects invalid email | `src/lib/validations/auth.test.ts` | Pass |
| T2-05 | Sign-up enforces password rules (length, upper, lower, number, special) | `src/lib/validations/auth.test.ts` | Pass |
| T2-06 | Sign-up requires confirm password | `src/lib/validations/auth.test.ts` | Pass |
| T2-07 | Sign-up rejects mismatched passwords | `src/lib/validations/auth.test.ts` | Pass |
| T2-08 | Sign-in accepts valid input | `src/lib/validations/auth.test.ts` | Pass |
| T2-09 | Sign-in requires email and password | `src/lib/validations/auth.test.ts` | Pass |
| T2-10 | Sign-in rejects invalid email | `src/lib/validations/auth.test.ts` | Pass |
| T2-11 | Sign-up action returns field errors for invalid input | `src/app/sign-up/actions.test.ts` | Pass |
| T2-12 | Sign-up action returns email conflict error | `src/app/sign-up/actions.test.ts` | Pass |
| T2-13 | Sign-up action returns generic error on failure | `src/app/sign-up/actions.test.ts` | Pass |
| T2-14 | Sign-up action redirects to sign-in on success | `src/app/sign-up/actions.test.ts` | Pass |
| T2-15 | Sign-in action returns field errors for invalid input | `src/app/sign-in/actions.test.ts` | Pass |
| T2-16 | Sign-in action returns generic invalid credentials message | `src/app/sign-in/actions.test.ts` | Pass |
| T2-17 | Sign-in action returns generic error on failure | `src/app/sign-in/actions.test.ts` | Pass |
| T2-18 | Sign-in action creates session and redirects to dashboard | `src/app/sign-in/actions.test.ts` | Pass |
| T2-19 | Sign-up form renders all required fields and sign-in link | `src/components/auth/sign-up-form.test.tsx` | Pass |
| T2-20 | Sign-in form renders fields, button, and sign-up link | `src/components/auth/sign-in-form.test.tsx` | Pass |
| T2-21 | Sign-in form shows registration success message | `src/components/auth/sign-in-form.test.tsx` | Pass |

### Phase 3: Protected Routes and Logout

| Test ID | Scenario | File | Status |
|---------|----------|------|--------|
| T3-01 | Logout destroys session and clears cookie | `src/app/dashboard/actions.test.ts` | Pass |
| T3-02 | Logout clears cookie when no session exists | `src/app/dashboard/actions.test.ts` | Pass |
| T3-03 | `getCurrentUser` returns null without cookie | `src/lib/auth/current-user.test.ts` | Pass |
| T3-04 | `getCurrentUser` returns user for valid session | `src/lib/auth/current-user.test.ts` | Pass |
| T3-05 | `requireAuth` redirects unauthenticated users to sign-in | `src/lib/auth/current-user.test.ts` | Pass |
| T3-06 | `redirectIfAuthenticated` redirects to dashboard | `src/lib/auth/current-user.test.ts` | Pass |

### Phase 4: End-to-End UI Verification

| Test ID | Scenario | File | Status |
|---------|----------|------|--------|
| T4-01 | Home page renders Quiz Maker landing content | `src/app/page.test.tsx` | Pass |
| T4-02 | Home page links to sign-up and sign-in | `src/app/page.test.tsx` | Pass |

### Acceptance criteria coverage

| PRD acceptance area | Covered by automated tests |
|---------------------|---------------------------|
| Sign Up validation and errors | T2-01 through T2-14 |
| Sign In validation and session creation | T2-08 through T2-18 |
| Logout | T3-01, T3-02, T1-14 |
| Protected route helpers | T3-03 through T3-06 |
| Password security | T1-01 through T1-06 |
| Navigation (home → auth pages) | T4-01, T4-02 |

### Manual verification still required

| Scenario | Reason |
|----------|--------|
| Browser refresh keeps session | Requires full HTTP cookie flow |
| Responsive layout on mobile/desktop | Visual QA |
| Auth under `npm run preview` (Workers runtime) | Integration / E2E outside unit suite |
| Remote D1 migrations applied before production deploy | Infrastructure step |

---

## Notes for AI Agents

When implementing from this PRD:

1. Read **Scope**, **Out of Scope**, and **Cut** before writing any code — do not build quiz features.
2. Do not add dependencies (database client, auth library, validation library) without proposing them to the user first.
3. Follow project conventions: Server Actions for forms, Zod validation, shadcn/ui `field` components, `@/` imports.
4. Enforce auth on the server for protected routes; do not rely on client-only checks.
5. Never store or log plain-text passwords.
6. Verify with `npm run lint`, `npm run build`, `npm run test`, and `npm run preview` before marking work complete.
7. Do not apply remote database migrations; local only per project rules.
8. Update this PRD's phase status and acceptance criteria checkboxes as work progresses.

---

## Current Status

**Last updated:** September 4, 2026  
**Current phase:** Authentication module complete (with automated test suite)  
**Status:** COMPLETED  
**Test status:** 54/54 automated tests passing (`npm run test`)  
**Next steps:** Begin quiz features in a subsequent sprint.
