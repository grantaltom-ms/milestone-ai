import { HubSidebar } from '../components/HubSidebar';
import { LogoutButton } from '../components/LogoutButton';

interface HubShellProps {
  title: string;
  eyebrow?: string;
  badge?: string;
  children: React.ReactNode;
}

export function HubShell({ title, eyebrow = 'Milestone Properties', badge, children }: HubShellProps) {
  return (
    <main className="min-h-screen bg-[#FAF7F2] text-[#0B1B2B]">
      <div className="flex min-h-screen">
        <HubSidebar />

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-10 border-b border-[rgba(11,27,43,0.08)] bg-[#FAF7F2] px-8 py-4">
            <div className="flex items-center justify-between gap-6">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2E6B5E]">
                  {eyebrow}
                </div>
                <h1 className="font-serif text-3xl font-semibold leading-tight text-[#1A2E44]">{title}</h1>
              </div>
              <div className="flex items-center gap-3">
                {badge && (
                  <div className="hidden rounded-md border border-[rgba(11,27,43,0.08)] bg-white px-3 py-2 text-xs text-[#0B1B2B]/60 md:block">
                    {badge}
                  </div>
                )}
                <LogoutButton />
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-7xl px-8 py-10">{children}</div>
        </div>
      </div>
    </main>
  );
}
