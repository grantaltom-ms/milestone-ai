# Milestone AI - conversation and implementation summary

## Scope

This document summarizes the planning and implementation work completed during the recent Milestone AI build session. It is intended as a repo-local history of the decisions made, the architecture direction chosen, and the implementation currently in progress.

## Product direction

Milestone AI is becoming a private internal operations hub for Milestone Properties. The goal is to create one central place for internal dashboards, manager review workflows, delinquency/POV automation, and future Milestone-owned tools.

The V1 hub is intentionally focused. It should not replace AppFolio. Instead, it should organize Milestone-owned workflows and link out to AppFolio, Google Drive, Slack, or other systems when those remain the source of truth.

Initial users for V1:

- Grant Carlson
- Conor Murphy
- Andrew Riviere

Initial access model:

- Managers should start by seeing only their own properties.
- Broader admin/global visibility can be added later.

Visual direction:

- Use the Milestone Properties design system.
- Prefer warm paper backgrounds, navy/evergreen colors, border-first cards, Playfair Display headings, and DM Sans UI text.
- The navigation can borrow the idea of a collapsible AppFolio-style sidebar, but the visual tone should feel like Milestone rather than a generic property-tech dashboard.

## Internal hub V1

The agreed V1 sidebar is:

```text
Home
Delinquency review
POV notices
Reports
```

Deferred pages:

- Work orders
- Properties/admin configuration
- General tools/links
- Tenant messages

### Home dashboard

The Home dashboard should focus on three priority sections:

1. Month-to-date charges assessed vs money received.
2. Bulletin board for significant events, due items, birthdays, and timely notes.
3. Vacant unit count, including total vacant, ready-to-rent, and in-progress units.

The first shell implementation includes these sections with real Supabase-backed money movement data and placeholder/demo data for bulletin board and vacancy counts.

### Delinquency review

The delinquency review page is the human-in-the-loop action queue. It should show candidates from the stored Supabase review queue and let managers decide what should happen before any email, SMS, or POV draft is created.

Candidate actions:

- Create POV draft
- Skip this run
- Exclude indefinitely
- Needs manual review

### POV notices

The POV notices page should act as the notice register after drafts are approved and created. It should track the created notice, manager, property, tenant, unit, Google Doc link, status, and approval metadata.

Agreed statuses:

- Draft
- Approved
- Served
- Voided

### Reports

Reports are valuable but should grow after the main action workflows are stable. Initial report ideas include:

- Month-to-date charges assessed vs money received.
- Delinquency candidates by month.
- POV drafts created by month.

## Delinquency review queue architecture

The delinquency system was shifted away from immediate cron side effects and toward a durable review queue.

The five improvements targeted were:

1. Supabase review queue tables.
2. Explicit action states.
3. Cached AppFolio report snapshots.
4. Keep AI out of deterministic steps.
5. Narrow endpoints for candidates/actions.

### Supabase schema

Added or continued work on:

- `supabase/migrations/0007_delinquency_review_queue.sql`

The migration adds durable tables for:

- `delinquency_runs`
- `delinquency_report_snapshots`
- `delinquency_candidates`

It also adds explicit constraints for run status, candidate review status, and candidate action state.

Candidate state values include:

- `candidate_found`
- `email_sent`
- `email_failed`
- `sms_sent`
- `sms_failed`
- `pov_draft_created`
- `pov_draft_failed`
- `manager_excluded`

Review status values include:

- `pending`
- `approved`
- `excluded`

RLS was enabled on the new queue tables. Server-side service-role access continues to work, while browser/client access requires future policies.

### Cron behavior

The delinquency cron route now queues review candidates instead of sending messages or creating notices directly.

Route:

```text
/api/cron/delinquency-check
```

Behavior:

- Pulls AppFolio reports.
- Computes deterministic eligibility.
- Stores raw report snapshots.
- Stores compact candidate rows.
- Returns queued candidates and action endpoint URLs.
- Does not send email, SMS, or POV notices directly.

The cron schedule was updated in `vercel.json` to run:

- Weekly on Tuesdays.
- Monthly on the 11th.

### Candidate endpoints

Added narrow candidate action endpoints:

```text
GET  /api/delinquency/candidates
GET  /api/delinquency/candidates/[id]
POST /api/delinquency/candidates/[id]/email
POST /api/delinquency/candidates/[id]/sms
POST /api/delinquency/candidates/[id]/pov
POST /api/delinquency/candidates/[id]/exclude
```

The action endpoints:

- Operate on stored candidate IDs.
- Validate candidate eligibility.
- Check duplicate action history.
- Record action results in Supabase.
- Update candidate state.

Duplicate protection was adjusted so only terminal successful/completed statuses block repeats. Failed attempts remain visible and retryable.

### Deterministic notice data

The delinquency parser already handles two important POV requirements:

- Late fees are excluded from POV notice charges.
- Risk Mitigation charges are excluded from POV notice charges.
- Notice tenant names are normalized from `Last, First` to `First Last`.

AI is not used for these deterministic charge and name transformations.

## Slack manager digest

The preferred Slack flow is one digest per manager per delinquency run.

The digest should list all relevant tenants for that manager in a compact format:

```text
POV Review Queue - Mae Santos

The following tenants may need Pay or Vacate notice drafts:

Aleara Hatvany - Ascona - Unit 206
Jordan Smith - Galer Crest - Unit 14
Maria Lopez - Queen Anne Flats - Unit 302

Google folder for Mae's POV drafts:
https://drive.google.com/drive/folders/...

Please review the queue and choose which notices to create.
```

Recommended Slack buttons:

```text
Open Review Queue
Open Google Folder
```

Slack should be the alert and summary layer. The app should be the decision and audit layer.

## Google Drive POV organization

The agreed Google Drive structure for created POV drafts is:

```text
Legal Notices / Pay or Vacate Notices / YYYY / YYYY-MM / <Manager Name> / Draft
```

Only one folder per manager is needed for V1: `Draft`.

Agreed file naming format:

```text
MM-DD-YYYY - Property - Unit - Tenant First Last - POV Notice Draft
```

Example:

```text
06-11-2026 - Ascona - 206 - Aleara Hatvany - POV Notice Draft
```

The app should store Google Doc IDs/URLs and status metadata in Supabase rather than relying on Drive folders for every notice state.

## Internal hub shell implementation

The old homepage was replaced with a V1 Milestone internal hub shell.

Main changed files:

- `src/app/page.tsx`
- `src/app/layout.tsx`
- `src/app/globals.css`
- `src/app/components/HubSidebar.tsx`
- `docs/internal-hub-v1-draft.md`

Implemented:

- Collapsible navy sidebar.
- Milestone-branded typography and colors.
- Home dashboard layout.
- Money movement card.
- Bulletin board placeholder section.
- Vacancy placeholder section.
- Preview sections for delinquency review, POV notices, and reports.

Local development:

- A local `.env.local` was created with a temporary admin password for local dashboard viewing.
- The local dev server was started and tested on available localhost ports.

## Supabase money movement card

The Home dashboard money movement card was wired to Supabase server-side.

Implementation:

- Added `getMonthlyMoneyMovement()` in `src/lib/dashboard.ts`.
- Updated `src/app/page.tsx` to fetch the summary as a Server Component.

Current V1 definition:

- Charges assessed: latest `rent_roll.monthly_rent` total from the most recent rent roll snapshot.
- Money received: current-month sum of `receivables_activity.receipt_amount`.

The card also calculates:

- Variance.
- Collection rate.
- Rent roll snapshot date.
- Latest receipt date.

Important caveat:

This definition treats charges assessed as scheduled monthly rent from the latest rent roll. It may not include all utility, fee, or other posted tenant charges. For a true all-in assessed charge total, Milestone will likely need a dedicated AppFolio tenant ledger/charge export or a Supabase table that stores posted tenant charges.

## Open decisions

Still to decide:

- Whether the sidebar defaults expanded or collapsed.
- How long delinquency report snapshots should be retained.
- Whether indefinite exclusions should be property-specific, occupancy-specific, or tenant-specific.
- Where bulletin board data should live: Supabase, Google Calendar, manual app entry, or a combination.
- Where vacancy readiness should come from: AppFolio, a manual tracker, or another source.
- Whether charges assessed should remain rent-roll-based or switch to a true posted-charge ledger source.

## Verification performed

The app was built successfully after the main implementation changes using:

```bash
npm run build
```

Builds passed after:

- The delinquency queue/action endpoint implementation.
- The V1 internal hub shell implementation.
- The Supabase-backed money movement card implementation.
