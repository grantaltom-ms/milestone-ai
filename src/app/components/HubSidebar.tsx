'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

interface HubNavItem {
  href: string;
  label: string;
  shortLabel: string;
}

const NAV_ITEMS: HubNavItem[] = [
  { href: '/', label: 'Home', shortLabel: 'H' },
  { href: '/major-assets', label: 'Major assets', shortLabel: 'A' },
  { href: '/#delinquency-review', label: 'Delinquency review', shortLabel: 'D' },
  { href: '/#pov-notices', label: 'POV notices', shortLabel: 'P' },
  { href: '/#reports', label: 'Reports', shortLabel: 'R' },
];

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  if (href.startsWith('/#')) return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function HubSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`min-h-screen border-r border-[rgba(11,27,43,0.12)] bg-[#1A2E44] text-[#F5F1E8] transition-all duration-200 ${
        collapsed ? 'w-[88px]' : 'w-[280px]'
      }`}
    >
      <div className="sticky top-0 flex h-screen flex-col px-4 py-5">
        <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : 'justify-between'}`}>
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-[#F5F1E8]/20 bg-[#F5F1E8] text-sm font-semibold text-[#1A2E44]">
              M
            </div>
            {!collapsed && (
              <div>
                <div className="font-serif text-lg leading-tight">Milestone</div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-[#F5F1E8]/60">Internal hub</div>
              </div>
            )}
          </Link>
          {!collapsed && (
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              className="rounded border border-[#F5F1E8]/20 px-2 py-1 text-xs text-[#F5F1E8]/70 hover:bg-[#F5F1E8]/10"
              aria-label="Collapse sidebar"
            >
              Hide
            </button>
          )}
        </div>

        {collapsed && (
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            className="mt-4 rounded border border-[#F5F1E8]/20 px-2 py-1 text-xs text-[#F5F1E8]/70 hover:bg-[#F5F1E8]/10"
            aria-label="Expand sidebar"
          >
            Show
          </button>
        )}

        <nav className="mt-10 space-y-1" aria-label="Primary navigation">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center rounded-md border px-3 py-2.5 text-sm transition ${
                  collapsed ? 'justify-center' : 'gap-3'
                } ${
                  active
                    ? 'border-[#F5F1E8]/20 bg-[#F5F1E8]/15 text-[#F5F1E8]'
                    : 'border-transparent text-[#F5F1E8]/75 hover:border-[#F5F1E8]/20 hover:bg-[#F5F1E8]/10 hover:text-[#F5F1E8]'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-sm text-xs font-semibold ${
                    active ? 'bg-[#2E6B5E] text-[#F5F1E8]' : 'bg-[#F5F1E8]/10 text-[#F5F1E8] group-hover:bg-[#2E6B5E]'
                  }`}
                >
                  {item.shortLabel}
                </span>
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-[#F5F1E8]/20 pt-4">
          {!collapsed ? (
            <div className="space-y-2 text-xs leading-relaxed text-[#F5F1E8]/60">
              <div className="text-[10px] uppercase tracking-[0.18em] text-[#C8922A]">V1 focus</div>
              <p>Money movement, major assets, vacancy counts, and manager review.</p>
            </div>
          ) : (
            <div className="mx-auto h-7 w-7 rounded-sm bg-[#C8922A]/20" />
          )}
        </div>
      </div>
    </aside>
  );
}
