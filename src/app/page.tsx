import { Suspense } from 'react';
import { HubSidebar } from './components/HubSidebar';
import { LogoutButton } from './components/LogoutButton';
import { MoneyMovementCard, MoneyMovementSkeleton } from './components/MoneyMovementCard';
import { SectionHeader, MetricCard } from './components/ui';
import { bulletinItems, vacancySummary, reviewCandidates, noticeDrafts } from '@/lib/placeholder-data';

export const dynamic = 'force-dynamic';

export default function Home() {
  const readyWidth = (vacancySummary.readyToRent / vacancySummary.totalVacant) * 100;

  return (
    <main className="min-h-screen bg-paper text-ink">
      <div className="flex min-h-screen">
        <HubSidebar />

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-10 border-b border-ink/8 bg-paper px-8 py-4">
            <div className="flex items-center justify-between gap-6">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-evergreen">
                  Milestone Properties
                </div>
                <h1 className="font-serif text-3xl font-semibold leading-tight text-navy">
                  Internal hub
                </h1>
              </div>
              <LogoutButton />
            </div>
          </header>

          <div className="mx-auto max-w-7xl space-y-16 px-8 py-10">
            <section id="home" className="scroll-mt-24 space-y-8">
              <div className="rounded-lg bg-navy p-8 text-cream">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber">
                  Home
                </div>
                <div className="mt-3 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
                  <div>
                    <h2 className="font-serif text-4xl font-semibold leading-tight">
                      The morning view of Milestone operations.
                    </h2>
                    <p className="mt-4 max-w-2xl text-sm leading-6 text-cream/70">
                      V1 focuses on money movement, timely notes, and vacancy readiness. Money
                      movement now reads from Supabase; bulletin and vacancy data are still layout
                      placeholders.
                    </p>
                  </div>
                  <div className="rounded-md border border-cream/20 bg-cream/10 p-4 text-sm text-cream/75">
                    Initial users: Grant Carlson, Conor Murphy, and Andrew Riviere. Managers start
                    with their own properties only.
                  </div>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <Suspense fallback={<MoneyMovementSkeleton />}>
                  <MoneyMovementCard />
                </Suspense>

                <div className="rounded-lg border border-ink/8 bg-white p-6">
                  <SectionHeader eyebrow="Vacancy" title="Vacant unit count" />
                  <div className="mt-7 grid grid-cols-3 gap-3">
                    <div className="rounded-md bg-cream p-4 text-center">
                      <div className="font-serif text-3xl font-semibold text-navy">
                        {vacancySummary.totalVacant}
                      </div>
                      <div className="mt-1 text-xs text-ink/60">Total vacant</div>
                    </div>
                    <div className="rounded-md bg-cream p-4 text-center">
                      <div className="font-serif text-3xl font-semibold text-evergreen">
                        {vacancySummary.readyToRent}
                      </div>
                      <div className="mt-1 text-xs text-ink/60">Ready</div>
                    </div>
                    <div className="rounded-md bg-cream p-4 text-center">
                      <div className="font-serif text-3xl font-semibold text-rust">
                        {vacancySummary.inProgress}
                      </div>
                      <div className="mt-1 text-xs text-ink/60">In progress</div>
                    </div>
                  </div>
                  <div className="mt-6 h-3 rounded-sm bg-cream">
                    <div className="h-3 rounded-sm bg-evergreen" style={{ width: `${readyWidth}%` }} />
                  </div>
                  <p className="mt-3 text-xs leading-5 text-ink/55">
                    Ready-to-rent share of vacant units. Source still needs to be confirmed.
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-ink/8 bg-white p-6">
                <SectionHeader
                  eyebrow="Bulletin board"
                  title="Significant events, due items, and birthdays"
                  description="A warm internal board for timely notes people should see when they open the hub."
                />
                <div className="mt-6 grid gap-3 md:grid-cols-3">
                  {bulletinItems.map((item) => (
                    <div
                      key={item.title}
                      className="rounded-md border border-ink/8 bg-paper p-4"
                    >
                      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-evergreen">
                        {item.label}
                      </div>
                      <div className="mt-2 font-medium text-navy">{item.title}</div>
                      <p className="mt-2 text-sm leading-5 text-ink/60">{item.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section id="delinquency-review" className="scroll-mt-24 space-y-6">
              <SectionHeader
                eyebrow="Manager review"
                title="Delinquency review"
                description="This section will use the stored Supabase review queue. Actions stay human-in-the-loop."
              />
              <div className="overflow-hidden rounded-lg border border-ink/8 bg-white">
                <div className="grid grid-cols-[1.1fr_1fr_0.5fr_0.8fr] border-b border-ink/8 bg-cream px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-ink/55">
                  <div>Tenant</div>
                  <div>Property</div>
                  <div>Unit</div>
                  <div>Manager</div>
                </div>
                {reviewCandidates.map((candidate) => (
                  <div
                    key={`${candidate.property}-${candidate.unit}`}
                    className="grid grid-cols-[1.1fr_1fr_0.5fr_0.8fr] border-b border-ink/[6%] px-5 py-4 text-sm last:border-b-0"
                  >
                    <div className="font-medium text-navy">{candidate.tenant}</div>
                    <div className="text-ink/70">{candidate.property}</div>
                    <div className="text-ink/70">{candidate.unit}</div>
                    <div className="text-ink/70">{candidate.manager}</div>
                  </div>
                ))}
              </div>
            </section>

            <section id="pov-notices" className="scroll-mt-24 space-y-6">
              <SectionHeader
                eyebrow="Notice register"
                title="POV notices"
                description="Created drafts will be tracked here with Google Doc links and status."
              />
              <div className="grid gap-4 md:grid-cols-3">
                {noticeDrafts.map((notice) => (
                  <div
                    key={`${notice.property}-${notice.unit}`}
                    className="rounded-lg border border-ink/8 bg-white p-5"
                  >
                    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-evergreen">
                      {notice.status}
                    </div>
                    <div className="mt-3 font-serif text-xl font-semibold text-navy">
                      {notice.tenant}
                    </div>
                    <p className="mt-2 text-sm text-ink/60">
                      {notice.property} - Unit {notice.unit}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section id="reports" className="scroll-mt-24 space-y-6">
              <SectionHeader
                eyebrow="Reports"
                title="Operator visibility"
                description="Reports can grow after the action pages are stable. V1 starts with money movement, delinquency activity, and POV draft activity."
              />
              <div className="rounded-lg border border-ink/8 bg-white p-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <MetricCard
                    label="Delinquency candidates"
                    value="24"
                    detail="Demo count for the latest refresh."
                  />
                  <MetricCard
                    label="POV drafts"
                    value="8"
                    detail="Demo count created this month."
                  />
                  <MetricCard
                    label="Refresh cadence"
                    value="Tue + 11th"
                    detail="Weekly Tuesday and monthly 11th queue refresh."
                  />
                </div>
              </div>
            </section>

            <footer className="border-t border-ink/8 py-6 text-xs text-ink/50">
              Built for Milestone Properties. V1 shell uses demo data until each source is confirmed.
            </footer>
          </div>
        </div>
      </div>
    </main>
  );
}
