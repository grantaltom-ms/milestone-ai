import { SidebarHideButton, SidebarShowButton } from './HubSidebarToggle';

interface HubNavItem {
  href: string;
  label: string;
  shortLabel: string;
}

const NAV_ITEMS: HubNavItem[] = [
  { href: '#home', label: 'Home', shortLabel: 'H' },
  { href: '#delinquency-review', label: 'Delinquency review', shortLabel: 'D' },
  { href: '#pov-notices', label: 'POV notices', shortLabel: 'P' },
  { href: '#reports', label: 'Reports', shortLabel: 'R' },
];

export function HubSidebar() {
  return (
    <aside
      id="hub-sidebar"
      data-collapsed="false"
      className="sidebar-root min-h-screen border-r border-cream/20 bg-navy text-cream"
    >
      <div className="sticky top-0 flex h-screen flex-col px-4 py-5">
        {/* Logo row — expanded */}
        <div className="sidebar-expanded flex items-center justify-between">
          <a href="#home" className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-cream/20 bg-cream text-sm font-semibold text-navy">
              M
            </div>
            <div>
              <div className="font-serif text-lg leading-tight">Milestone</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-cream/60">
                Internal hub
              </div>
            </div>
          </a>
          <SidebarHideButton className="rounded border border-cream/20 px-2 py-1 text-xs text-cream/70 hover:bg-cream/10" />
        </div>

        {/* Logo row — collapsed */}
        <div className="sidebar-collapsed flex flex-col items-center gap-3">
          <a href="#home">
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-cream/20 bg-cream text-sm font-semibold text-navy">
              M
            </div>
          </a>
          <SidebarShowButton className="rounded border border-cream/20 px-2 py-1 text-xs text-cream/70 hover:bg-cream/10" />
        </div>

        <nav className="mt-10 space-y-1" aria-label="Primary navigation">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="sidebar-nav-link group flex items-center rounded-md border border-transparent px-3 py-2.5 text-sm text-cream/75 transition hover:border-cream/20 hover:bg-cream/10 hover:text-cream"
              title={item.label}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-cream/10 text-xs font-semibold text-cream group-hover:bg-evergreen">
                {item.shortLabel}
              </span>
              <span className="sidebar-expanded ml-3">{item.label}</span>
            </a>
          ))}
        </nav>

        <div className="mt-auto border-t border-cream/20 pt-4">
          <div className="sidebar-expanded space-y-2 text-xs leading-relaxed text-cream/60">
            <div className="text-[10px] uppercase tracking-[0.18em] text-amber">V1 focus</div>
            <p>Money movement, bulletin board, vacancy counts, and manager review.</p>
          </div>
          <div className="sidebar-collapsed flex justify-center">
            <div className="h-7 w-7 rounded-sm bg-amber/20" />
          </div>
        </div>
      </div>
    </aside>
  );
}
