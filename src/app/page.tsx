import { HubSidebar } from './components/HubSidebar';
import { LogoutButton } from './components/LogoutButton';
import { getMonthlyMoneyMovement } from '@/lib/dashboard';

export const dynamic = 'force-dynamic';

const bulletinItems = [
  {
    label: 'Due today',
    title: 'June delinquency review queue',
    detail: 'Review candidates before creating POV drafts.',
  },
  {
    label: 'Event',
    title: 'Portfolio check-in',
    detail: 'Conor and Andrew to review open items this week.',
  },
  {
    label: 'Birthday',
    title: 'Team birthday reminder',
    detail: 'Add staff birthday source before wiring real data.',
  },
];

const vacancySummary = {
  totalVacant: 18,
  readyToRent: 7,
  inProgress: 11,
};

const reviewCandidates = [
  { tenant: 'Aleara Hatvany', property: 'Ascona', unit: '206', manager: 'Mae Santos' },
  { tenant: 'Jordan Smith', property: 'Galer Crest', unit: '14', manager: 'Conor Murphy' },
  { tenant: 'Maria Lopez', property: 'Queen Anne Flats', unit: '302', manager: 'Andrew Riviere' },
];

const noticeDrafts = [
  { tenant: 'Aleara Hatvany', property: 'Ascona', unit: '206', status: 'Draft' },
  { tenant: 'Jordan Smith', property: 'Galer Crest', unit: '14', status: 'Approved' },
  { tenant: 'Maria Lopez', property: 'Queen Anne Flats', unit: '302', status: 'Voided' },
];

function currency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function percent(value: number | null): string {
  if (value === null) return 'n/a';
  return `${Math.round(value * 10) / 10}%`;
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2E6B5E]">
        {eyebrow}
      </div>
      <h2 className="font-serif text-3xl font-semibold leading-tight text-[#1A2E44]">{title}</h2>
      {description && <p className="max-w-3xl text-sm leading-6 text-[#0B1B2B]/65">{description}</p>}
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-lg border border-[rgba(11,27,43,0.08)] bg-white p-5">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2E6B5E]">{label}</div>
      <div className="mt-3 font-serif text-3xl font-semibold text-[#1A2E44]">{value}</div>
      <p className="mt-2 text-sm leading-6 text-[#0B1B2B]/60">{detail}</p>
    </div>
  );
}

export default async function Home() {
  const moneyMovement = await getMonthlyMoneyMovement();
  const receivedWidth = Math.min(
    100,
    moneyMovement.chargesAssessed > 0
      ? (moneyMovement.moneyReceived / moneyMovement.chargesAssessed) * 100
      : 0
  );
  const readyWidth = (vacancySummary.readyToRent / vacancySummary.totalVacant) * 100;

  return (
    <main className="min-h-screen bg-[#FAF7F2] text-[#0B1B2B]">
      <div className="flex min-h-screen">
        <HubSidebar />

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-10 border-b border-[rgba(11,27,43,0.08)] bg-[#FAF7F2] px-8 py-4">
            <div className="flex items-center justify-between gap-6">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2E6B5E]">
                  Milestone Properties
                </div>
                <h1 className="font-serif text-3xl font-semibold leading-tight text-[#1A2E44]">
                  Internal hub
                </h1>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden rounded-md border border-[rgba(11,27,43,0.08)] bg-white px-3 py-2 text-xs text-[#0B1B2B]/60 md:block">
                  {moneyMovement.source === 'supabase' ? 'Live Supabase money data' : 'Demo dashboard data'}
                </div>
                <LogoutButton />
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-7xl space-y-16 px-8 py-10">
            <section id="home" className="scroll-mt-24 space-y-8">
              <div className="rounded-lg bg-[#1A2E44] p-8 text-[#F5F1E8]">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#C8922A]">
                  Home
                </div>
                <div className="mt-3 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
                  <div>
                    <h2 className="font-serif text-4xl font-semibold leading-tight">
                      The morning view of Milestone operations.
                    </h2>
                    <p className="mt-4 max-w-2xl text-sm leading-6 text-[#F5F1E8]/70">
                      V1 focuses on money movement, timely notes, and vacancy readiness. Money movement now reads from
                      Supabase; bulletin and vacancy data are still layout placeholders.
                    </p>
                  </div>
                  <div className="rounded-md border border-[#F5F1E8]/20 bg-[#F5F1E8]/10 p-4 text-sm text-[#F5F1E8]/75">
                    Initial users: Grant Carlson, Conor Murphy, and Andrew Riviere. Managers start with their own
                    properties only.
                  </div>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-lg border border-[rgba(11,27,43,0.08)] bg-white p-6">
                  <SectionHeader
                    eyebrow="Money movement"
                    title={`${moneyMovement.month} charges vs receipts`}
                    description="Charges use the latest rent roll monthly rent total. Receipts use current-month AppFolio receivables activity."
                  />
                  <div className="mt-8 space-y-5">
                    <div>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="font-medium text-[#1A2E44]">Monthly charges assessed</span>
                        <span className="text-[#0B1B2B]/60">{currency(moneyMovement.chargesAssessed)}</span>
                      </div>
                      <div className="h-4 rounded-sm bg-[#F5F1E8]">
                        <div className="h-4 rounded-sm bg-[#1A2E44]" style={{ width: '100%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="font-medium text-[#1A2E44]">Money received</span>
                        <span className="text-[#0B1B2B]/60">{currency(moneyMovement.moneyReceived)}</span>
                      </div>
                      <div className="h-4 rounded-sm bg-[#F5F1E8]">
                        <div className="h-4 rounded-sm bg-[#2E6B5E]" style={{ width: `${receivedWidth}%` }} />
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 grid gap-3 text-sm md:grid-cols-3">
                    <div className="rounded-md bg-[#F5F1E8] p-3">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#2E6B5E]">
                        Collection rate
                      </div>
                      <div className="mt-1 font-serif text-xl font-semibold text-[#1A2E44]">
                        {percent(moneyMovement.collectionRate)}
                      </div>
                    </div>
                    <div className="rounded-md bg-[#F5F1E8] p-3">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#2E6B5E]">
                        Variance
                      </div>
                      <div className="mt-1 font-serif text-xl font-semibold text-[#1A2E44]">
                        {currency(moneyMovement.variance)}
                      </div>
                    </div>
                    <div className="rounded-md bg-[#F5F1E8] p-3">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#2E6B5E]">
                        Source
                      </div>
                      <div className="mt-1 text-xs leading-5 text-[#0B1B2B]/60">
                        Rent roll {moneyMovement.rentRollSnapshotDate ?? 'demo'}; receipts through{' '}
                        {moneyMovement.latestReceiptDate ?? 'demo'}.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-[rgba(11,27,43,0.08)] bg-white p-6">
                  <SectionHeader eyebrow="Vacancy" title="Vacant unit count" />
                  <div className="mt-7 grid grid-cols-3 gap-3">
                    <div className="rounded-md bg-[#F5F1E8] p-4 text-center">
                      <div className="font-serif text-3xl font-semibold text-[#1A2E44]">
                        {vacancySummary.totalVacant}
                      </div>
                      <div className="mt-1 text-xs text-[#0B1B2B]/60">Total vacant</div>
                    </div>
                    <div className="rounded-md bg-[#F5F1E8] p-4 text-center">
                      <div className="font-serif text-3xl font-semibold text-[#2E6B5E]">
                        {vacancySummary.readyToRent}
                      </div>
                      <div className="mt-1 text-xs text-[#0B1B2B]/60">Ready</div>
                    </div>
                    <div className="rounded-md bg-[#F5F1E8] p-4 text-center">
                      <div className="font-serif text-3xl font-semibold text-[#8B4A2F]">
                        {vacancySummary.inProgress}
                      </div>
                      <div className="mt-1 text-xs text-[#0B1B2B]/60">In progress</div>
                    </div>
                  </div>
                  <div className="mt-6 h-3 rounded-sm bg-[#F5F1E8]">
                    <div className="h-3 rounded-sm bg-[#2E6B5E]" style={{ width: `${readyWidth}%` }} />
                  </div>
                  <p className="mt-3 text-xs leading-5 text-[#0B1B2B]/55">
                    Ready-to-rent share of vacant units. Source still needs to be confirmed.
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-[rgba(11,27,43,0.08)] bg-white p-6">
                <SectionHeader
                  eyebrow="Bulletin board"
                  title="Significant events, due items, and birthdays"
                  description="A warm internal board for timely notes people should see when they open the hub."
                />
                <div className="mt-6 grid gap-3 md:grid-cols-3">
                  {bulletinItems.map((item) => (
                    <div key={item.title} className="rounded-md border border-[rgba(11,27,43,0.08)] bg-[#FAF7F2] p-4">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#2E6B5E]">
                        {item.label}
                      </div>
                      <div className="mt-2 font-medium text-[#1A2E44]">{item.title}</div>
                      <p className="mt-2 text-sm leading-5 text-[#0B1B2B]/60">{item.detail}</p>
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
              <div className="overflow-hidden rounded-lg border border-[rgba(11,27,43,0.08)] bg-white">
                <div className="grid grid-cols-[1.1fr_1fr_0.5fr_0.8fr] border-b border-[rgba(11,27,43,0.08)] bg-[#F5F1E8] px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#0B1B2B]/55">
                  <div>Tenant</div>
                  <div>Property</div>
                  <div>Unit</div>
                  <div>Manager</div>
                </div>
                {reviewCandidates.map((candidate) => (
                  <div
                    key={`${candidate.property}-${candidate.unit}`}
                    className="grid grid-cols-[1.1fr_1fr_0.5fr_0.8fr] border-b border-[rgba(11,27,43,0.06)] px-5 py-4 text-sm last:border-b-0"
                  >
                    <div className="font-medium text-[#1A2E44]">{candidate.tenant}</div>
                    <div className="text-[#0B1B2B]/70">{candidate.property}</div>
                    <div className="text-[#0B1B2B]/70">{candidate.unit}</div>
                    <div className="text-[#0B1B2B]/70">{candidate.manager}</div>
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
                  <div key={`${notice.property}-${notice.unit}`} className="rounded-lg border border-[rgba(11,27,43,0.08)] bg-white p-5">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#2E6B5E]">
                      {notice.status}
                    </div>
                    <div className="mt-3 font-serif text-xl font-semibold text-[#1A2E44]">{notice.tenant}</div>
                    <p className="mt-2 text-sm text-[#0B1B2B]/60">
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
              <div className="rounded-lg border border-[rgba(11,27,43,0.08)] bg-white p-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <MetricCard label="Delinquency candidates" value="24" detail="Demo count for the latest refresh." />
                  <MetricCard label="POV drafts" value="8" detail="Demo count created this month." />
                  <MetricCard label="Refresh cadence" value="Tue + 11th" detail="Weekly Tuesday and monthly 11th queue refresh." />
                </div>
              </div>
            </section>

            <footer className="border-t border-[rgba(11,27,43,0.08)] py-6 text-xs text-[#0B1B2B]/50">
              Built for Milestone Properties. V1 shell uses demo data until each source is confirmed.
            </footer>
          </div>
        </div>
      </div>
    </main>
  );
}
