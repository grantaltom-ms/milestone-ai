# Milestone AI

Private operations hub and automation layer for **Milestone Properties**. Built with Next.js 14 App Router, TypeScript, Supabase, Vercel, Slack, Gmail, Twilio, AppFolio data, and Google Drive.

Milestone AI is intended to become the central internal place to review property operations, see dashboard data, manage delinquency workflows, and connect future Milestone-owned tools.

## Current Status

This repo is in active V1 development.

Built so far:

- Milestone-branded internal hub shell.
- Collapsible left sidebar.
- Home dashboard with money movement, bulletin board, and vacancy sections.
- Supabase-backed money movement card.
- Delinquency review queue architecture.
- Candidate action endpoints for email, SMS, POV drafts, and exclusions.
- Cached AppFolio delinquency report snapshots.
- POV notice Google Drive and Slack manager digest planning.
- Work-order intake automation from earlier development.

## V1 Internal Hub

The first version of the app focuses on four sidebar sections:

```text
Home
Delinquency review
POV notices
Reports
```

Initial users:

- Grant Carlson
- Conor Murphy
- Andrew Riviere

Initial access model:

- Managers should start by seeing only their own properties.
- Broader admin/global access can be added later.

Visual direction:

- Milestone brand-forward.
- Warm paper backgrounds.
- Navy and evergreen palette.
- Border-first cards.
- Playfair Display headings.
- DM Sans interface text.
- Collapsible sidebar inspired by AppFolio structure, but visually Milestone.

## Home Dashboard

The Home dashboard is the morning operating view. V1 focuses on:

1. Month-to-date charges assessed vs money received.
2. Bulletin board for significant events, due items, birthdays, and notes.
3. Vacant unit count, including total vacant, ready-to-rent, and in-progress units.

### Money Movement Data

The money movement card is wired to Supabase server-side.

Current V1 definition:

- **Charges assessed:** latest `rent_roll.monthly_rent` total from the most recent rent roll snapshot.
- **Money received:** current-month sum of `receivables_activity.receipt_amount`.

The card also calculates:

- Variance.
- Collection rate.
- Rent roll snapshot date.
- Latest receipt date.

Important caveat:

The current "charges assessed" number is based on scheduled monthly rent from rent roll. It may not include all utility, fee, or other posted tenant charges. For true all-in assessed charges, the app will likely need a dedicated AppFolio tenant ledger/charge export or a Supabase table for posted tenant charges.

## Delinquency Review Queue

The delinquency system now uses a human review queue instead of direct cron side effects.

The cron route:

```text
/api/cron/delinquency-check
```

What it does:

1. Pulls AppFolio delinquency-related reports.
2. Computes deterministic candidate eligibility.
3. Stores raw report snapshots in Supabase.
4. Stores compact candidate rows in Supabase.
5. Returns candidate IDs and action endpoint URLs for manager review.

What it does not do:

- It does not send emails directly.
- It does not send SMS directly.
- It does not create POV notices directly.

Those actions happen through narrow candidate endpoints after human review.

### Schedule

`vercel.json` currently runs:

- Work-order polling every 30 minutes.
- Delinquency review queue weekly on Tuesdays.
- Delinquency review queue monthly on the 11th.

## Candidate Action Endpoints

Candidate review endpoints:

```text
GET  /api/delinquency/candidates
GET  /api/delinquency/candidates/[id]
POST /api/delinquency/candidates/[id]/email
POST /api/delinquency/candidates/[id]/sms
POST /api/delinquency/candidates/[id]/pov
POST /api/delinquency/candidates/[id]/exclude
```

The endpoints:

- Operate on stored candidate IDs.
- Validate eligibility.
- Check duplicate action history.
- Record action results.
- Update candidate state.
- Allow failed attempts to be visible and retryable.

Candidate states include:

```text
candidate_found
email_sent
email_failed
sms_sent
sms_failed
pov_draft_created
pov_draft_failed
manager_excluded
```

Review statuses include:

```text
pending
approved
excluded
```

## POV Notice Rules

POV notice payloads are built deterministically.

Current rules:

- Late fees are excluded from POV notice charges.
- Risk Mitigation charges are excluded from POV notice charges.
- Tenant names are normalized from `Last, First` to `First Last`.
- `milestone-pov` owns Google Doc template rendering.

## Slack Manager Digest

The preferred Slack flow is one digest message per manager per delinquency run.

Example:

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

Slack should alert and summarize. The app should handle decisions and audit history.

## Google Drive POV Organization

Agreed folder structure:

```text
Legal Notices / Pay or Vacate Notices / YYYY / YYYY-MM / <Manager Name> / Draft
```

Agreed file naming format:

```text
MM-DD-YYYY - Property - Unit - Tenant First Last - POV Notice Draft
```

Example:

```text
06-11-2026 - Ascona - 206 - Aleara Hatvany - POV Notice Draft
```

The app should store the Google Doc ID, URL, status, manager, and approval metadata in Supabase.

## Work-Order Intake Pipeline

This repo also contains an earlier work-order intake automation.

Route:

```text
/api/cron/poll-work-orders
```

High-level flow:

1. Vercel Cron checks Gmail for unread AppFolio work-order emails.
2. The parser extracts structured work-order details.
3. Tenant info is resolved through Supabase and AppFolio-derived data.
4. The work order is upserted into Supabase.
5. SMS is sent through Twilio.
6. Tenant replies are handled by `/api/webhooks/twilio-reply`.
7. The intake agent extracts availability/access notes and escalates emergencies.
8. Managers receive one summarized notification when intake is complete or escalated.

Intake states:

```text
awaiting_availability
awaiting_access
complete
```

## Important Files

```text
src/app/page.tsx                         # Internal hub homepage
src/app/layout.tsx                       # App metadata and root layout
src/app/globals.css                      # Milestone visual foundation
src/app/components/HubSidebar.tsx        # Collapsible hub sidebar
src/lib/dashboard.ts                     # Dashboard data helpers
src/lib/supabase.ts                      # Server-side Supabase client
src/lib/delinquency.ts                   # Delinquency parsing and candidate logic
src/lib/delinquency-store.ts             # Review queue persistence
src/lib/delinquency-action-runner.ts     # Candidate action runner
src/lib/delinquency-outreach.ts          # Email, SMS, and POV calls
src/app/api/cron/delinquency-check       # Delinquency queue refresh
src/app/api/delinquency/candidates       # Candidate list/detail/actions
supabase/migrations                      # Supabase schema changes
docs/internal-hub-v1-draft.md            # V1 product draft
docs/conversation-history-summary.md     # Session history and decisions
```

## Environment Variables

Create a local `.env.local` file for development. Do not commit this file.

Important variables:

| Variable | Purpose |
| --- | --- |
| `ADMIN_PASSWORD` | Local/admin login password |
| `SUPABASE_URL` | Main Milestone Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only Supabase service role key |
| `EXPENSES_SUPABASE_URL` | Secondary Supabase project for tenant reply logs |
| `EXPENSES_SUPABASE_SERVICE_ROLE_KEY` | Server-only service role key for the secondary project |
| `GMAIL_CLIENT_ID` | Gmail OAuth client ID |
| `GMAIL_CLIENT_SECRET` | Gmail OAuth client secret |
| `GMAIL_REFRESH_TOKEN` | Gmail refresh token |
| `GMAIL_USER` | Gmail mailbox used by the automation |
| `TWILIO_ACCOUNT_SID` | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | Twilio auth token |
| `TWILIO_FROM_NUMBER` | Twilio sender number |
| `SLACK_BOT_TOKEN` | Slack bot token |
| `ANTHROPIC_API_KEY` | Anthropic API key |
| `CRON_SECRET` | Secret used to protect cron routes |
| `MILESTONE_POV_API_URL` | URL for the milestone-pov service |
| `POV_API_SECRET` | Secret used to call milestone-pov |

Never expose service role keys or secrets in browser code. Do not prefix secrets with `NEXT_PUBLIC_`.

## Local Development

Install dependencies:

```bash
npm install
```

Start the local app:

```bash
npm run dev
```

Open the local URL shown by Next.js, usually:

```text
http://localhost:3000
```

If port 3000 is busy, Next.js may use 3001, 3002, or another port.

Build locally:

```bash
npm run build
```

## Supabase Setup

Run the main-project migrations against the main Milestone Supabase project:

```bash
psql "$SUPABASE_DB_URL" -f supabase/migrations/0001_work_order_sms_columns.sql
psql "$SUPABASE_DB_URL" -f supabase/migrations/0003_intake_state.sql
psql "$SUPABASE_DB_URL" -f supabase/migrations/0005_delinquency_actions.sql
psql "$SUPABASE_DB_URL" -f supabase/migrations/0006_delinquency_actions_email.sql
psql "$SUPABASE_DB_URL" -f supabase/migrations/0007_delinquency_review_queue.sql
```

Run expenses-v2 migrations against the secondary tenant replies project:

```bash
psql "$EXPENSES_SUPABASE_DB_URL" -f supabase/migrations/0002_tenant_replies_expenses_v2.sql
psql "$EXPENSES_SUPABASE_DB_URL" -f supabase/migrations/0004_tenant_replies_direction.sql
```

## Deployment

The project is intended to deploy on Vercel.

Typical deployment flow:

```bash
vercel link --scope grantaltom-ms-projects
vercel env pull .env.local
vercel deploy --prod
```

Make sure production and preview Vercel environments include the required server-side env vars.

## Open Decisions

Still to decide:

- Whether the sidebar defaults expanded or collapsed.
- How long delinquency report snapshots should be retained.
- Whether indefinite exclusions should be property-specific, occupancy-specific, or tenant-specific.
- Where bulletin board data should live: Supabase, Google Calendar, manual app entry, or a combination.
- Where vacancy readiness should come from: AppFolio, a manual tracker, or another source.
- Whether charges assessed should remain rent-roll-based or switch to a true posted-charge ledger source.

## Related Docs

- `docs/internal-hub-v1-draft.md`
- `docs/conversation-history-summary.md`
