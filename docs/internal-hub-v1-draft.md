# Milestone internal hub - V1 draft

## Purpose

Build one private internal hub for Milestone Properties operations. The app should become the central place to see what needs attention, review automation output, and open the right next tool without hunting through Slack, Google Drive, AppFolio, and separate scripts.

The first version should stay practical. It should not try to replace AppFolio. It should organize Milestone-owned workflows around the home dashboard, delinquency review, POV drafts, and reports.

## Initial users

V1 is for:

- Grant Carlson
- Conor Murphy
- Andrew Riviere

Managers should start by seeing only their own properties. Admin/global access can be added later if needed.

## Product direction

The hub should feel like an internal operating desk:

- Clear, quiet, and trustworthy.
- Warm Milestone branding, not a generic tech dashboard.
- Collapsible left sidebar similar in structure to AppFolio's left navigation.
- Fast access to daily work first.
- Links out to AppFolio and Google Drive when those systems are still the source of truth.
- Brings Milestone-owned workflows directly into the app when we control the data and action.
- More like the Milestone brand guide than AppFolio visually: warm paper backgrounds, navy/evergreen, border-first cards, Playfair headings, DM Sans UI text.

## V1 sidebar

```text
Home
Delinquency review
POV notices
Reports
```

## 1. Home dashboard

Purpose: show the morning view of money movement, events, and vacancy status.

The Home dashboard should summarize the most important operating signals without becoming the place where every action happens. It should point managers and admins toward the right work area.

### V1 priority sections

1. Month-to-date charges vs money received
   - Visualization of total charges assessed for the month.
   - Visualization of total money received for the month.
   - Ideally shown as a simple comparison with variance.

2. Bulletin board
   - Significant events.
   - Items due.
   - Staff birthdays.
   - Other timely notes that people should see when they open the hub.

3. Vacant unit count
   - Total units currently vacant.
   - Vacant units ready to re-rent.
   - Vacant units still in progress.

### Notes

The Home dashboard should feel like a useful front desk, not a crowded analytics wall. Keep it focused on the three priority sections above for V1.

## 2. Delinquency review

Purpose: review candidates before any email, SMS, or POV draft is created.

This is the main human-in-the-loop page for the delinquency queue. The system refreshes candidate data from AppFolio on Tuesdays and on the 11th of each month, then stores candidates in Supabase for review.

### V1 features

- Weekly/monthly candidate queue
- Last refreshed timestamp
- Filter by manager, property, month, and review status
- Manager review by property
- Reason each candidate was flagged
- Notice total vs current balance
- Link to candidate detail
- Link to manager Google Drive POV folder

### Candidate actions

- Create POV draft
- Skip this run
- Exclude indefinitely
- Needs manual review

### Notes

Actions should operate on stored candidate IDs. The page should make it clear when the data was last refreshed. For high-stakes work, the safest flow is to refresh the queue, review the newest candidate rows, then act.

## 3. POV notices

Purpose: track created POV drafts after approval.

This should act as the notice register. It is not the same as the delinquency review queue. The review queue decides what to create; the POV notices page tracks what was created.

### V1 columns

- Tenant
- Property
- Unit
- Manager
- Created date
- Google Doc link
- Status
- Approved by

### V1 statuses

- Draft
- Approved
- Served
- Voided

### Google Drive organization

Generated notices should save to:

```text
Legal Notices / Pay or Vacate Notices / YYYY / YYYY-MM / <Manager Name> / Draft
```

File naming format:

```text
MM-DD-YYYY - Property - Unit - Tenant First Last - POV Notice Draft
```

Example:

```text
06-11-2026 - Ascona - 206 - Aleara Hatvany - POV Notice Draft
```

## 4. Reports

Purpose: show trends and operator visibility after the core workflows are stable.

Reports are useful, but they should not block V1. The first version can start with simple summaries and grow after the action pages are working.

### Initial report ideas

- Month-to-date charges assessed vs money received
- Delinquency candidates by month
- POV drafts created by month

## Deferred pages

These are useful, but not part of the first build:

- Work orders
- Properties/admin configuration
- General tools/links
- Tenant messages

## Slack manager digest

For POV review, Slack should send one digest per manager per delinquency run.

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

Recommended buttons:

```text
Open Review Queue
Open Google Folder
```

Slack should be the alert and summary layer. The app should be the decision and audit layer.

## Build sequence

### Phase 1: App shell

- Private auth
- Collapsible sidebar
- Shared page layout
- Home dashboard shell with the three priority sections
- Milestone visual styling using the design system

### Phase 2: Home data

- Month-to-date charges assessed vs money received
- Bulletin board content model
- Vacancy counts: total vacant, ready to re-rent, in progress

### Phase 3: Delinquency review

- Candidate list
- Candidate detail
- Candidate actions
- Exclusion choices
- Manager Slack digest

### Phase 4: POV notices

- Notice register
- Google Drive folder links
- Store manager folder IDs
- Show created Google Docs
- Track draft, approved, served, and voided statuses

### Phase 5: Reports

- Reports overview
- Month-to-date charges vs receipts trend
- Delinquency and POV activity

## Open decisions

- Whether the sidebar should default expanded or collapsed.
- How long delinquency report snapshots should be retained.
- Whether indefinite exclusions should be property-specific, occupancy-specific, or tenant-specific.
- Where bulletin board data should live: Supabase, Google Calendar, manual app entry, or a combination.
- Where vacancy readiness should come from: AppFolio, a manual tracker, or another source.
