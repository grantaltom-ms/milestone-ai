export function SectionHeader({
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
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-evergreen">
        {eyebrow}
      </div>
      <h2 className="font-serif text-3xl font-semibold leading-tight text-navy">{title}</h2>
      {description && (
        <p className="max-w-3xl text-sm leading-6 text-ink/65">{description}</p>
      )}
    </div>
  );
}

export function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-lg border border-ink/8 bg-white p-5">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-evergreen">
        {label}
      </div>
      <div className="mt-3 font-serif text-3xl font-semibold text-navy">{value}</div>
      <p className="mt-2 text-sm leading-6 text-ink/60">{detail}</p>
    </div>
  );
}
