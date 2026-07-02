import { getMonthlyMoneyMovement } from '@/lib/dashboard';
import { currency, percent } from '@/lib/format';
import { SectionHeader } from './ui';

export async function MoneyMovementCard() {
  const moneyMovement = await getMonthlyMoneyMovement();
  const receivedWidth = Math.min(
    100,
    moneyMovement.chargesAssessed > 0
      ? (moneyMovement.moneyReceived / moneyMovement.chargesAssessed) * 100
      : 0
  );

  return (
    <div className="rounded-lg border border-ink/8 bg-white p-6">
      <SectionHeader
        eyebrow="Money movement"
        title={`${moneyMovement.month} charges vs receipts`}
        description="Charges use the latest rent roll monthly rent total. Receipts use current-month AppFolio receivables activity."
      />
      <div className="mt-8 space-y-5">
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-navy">Monthly charges assessed</span>
            <span className="text-ink/60">{currency(moneyMovement.chargesAssessed)}</span>
          </div>
          <div className="h-4 rounded-sm bg-cream">
            <div className="h-4 rounded-sm bg-navy" style={{ width: '100%' }} />
          </div>
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-navy">Money received</span>
            <span className="text-ink/60">{currency(moneyMovement.moneyReceived)}</span>
          </div>
          <div className="h-4 rounded-sm bg-cream">
            <div className="h-4 rounded-sm bg-evergreen" style={{ width: `${receivedWidth}%` }} />
          </div>
        </div>
      </div>
      <div className="mt-6 grid gap-3 text-sm md:grid-cols-3">
        <div className="rounded-md bg-cream p-3">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-evergreen">
            Collection rate
          </div>
          <div className="mt-1 font-serif text-xl font-semibold text-navy">
            {percent(moneyMovement.collectionRate)}
          </div>
        </div>
        <div className="rounded-md bg-cream p-3">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-evergreen">
            Variance
          </div>
          <div className="mt-1 font-serif text-xl font-semibold text-navy">
            {currency(moneyMovement.variance)}
          </div>
        </div>
        <div className="rounded-md bg-cream p-3">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-evergreen">
            Source
          </div>
          <div className="mt-1 text-xs leading-5 text-ink/60">
            Rent roll {moneyMovement.rentRollSnapshotDate ?? 'demo'}; receipts through{' '}
            {moneyMovement.latestReceiptDate ?? 'demo'}.
          </div>
        </div>
      </div>
    </div>
  );
}

export function MoneyMovementSkeleton() {
  return (
    <div className="rounded-lg border border-ink/8 bg-white p-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-3 w-28 rounded bg-ink/8" />
        <div className="h-8 w-72 rounded bg-ink/8" />
        <div className="h-4 w-96 rounded bg-ink/8" />
      </div>
      <div className="mt-8 space-y-5">
        <div className="h-4 rounded-sm bg-ink/8" />
        <div className="h-4 rounded-sm bg-ink/8" />
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <div className="h-16 rounded-md bg-ink/8" />
        <div className="h-16 rounded-md bg-ink/8" />
        <div className="h-16 rounded-md bg-ink/8" />
      </div>
    </div>
  );
}
