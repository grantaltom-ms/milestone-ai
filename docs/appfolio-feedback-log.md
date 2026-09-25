# AppFolio Integration Feedback Log

This tracks decisions or missing source data encountered while adding the
lighter AppFolio-backed Milestone AI features. Work continues on other pages
unless every remaining item is blocked.

## Decisions Applied

1. **Daily change definitions**
   - Use retained daily snapshots for true "new since yesterday", "paid down",
     and "resolved since yesterday" cards.
   - Current digest cards stay on current-state live feeds until snapshot
     tables and scheduled jobs are added.

2. **Manager assignment source of truth**
   - Use Supabase `property_managers` as the source of truth.
   - Rows fall back to `Unassigned` only when the table is missing or a property
     has no manager mapping.

3. **Vacancy readiness categories**
   - Track vacant units only for now.
   - Ready-to-rent and in-progress turn categorization is deferred.

4. **Collections action thresholds**
   - Treat `$1,000+` balance, any 30+ balance, or notice/legal/escalated status
     as an action case.
   - Continue to track `$5,000+` as the separate high-balance concentration
     threshold.

5. **Balance sheet and loan cadence**
   - Use a monthly refresh cadence for balance sheet and loan data.
   - Asset watch reads `balance_sheets`.

## Deferred Heavy-Lift Items

- General ledger anomaly detection.
- Generated owner/investor reporting packets.
