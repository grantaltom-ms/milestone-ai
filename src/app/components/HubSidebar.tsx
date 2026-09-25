"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type NavItem = {
  label: string;
  href: string;
  icon: (props: { className?: string }) => JSX.Element;
};

const NAV_ITEMS: NavItem[] = [
  {
    label: "Home",
    href: "/",
    icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5 9.5V21h14V9.5" />
        <path d="M9.5 21v-6h5v6" />
      </svg>
    ),
  },
  {
    label: "Delinquency dashboard",
    href: "/delinquency-dashboard",
    icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M4 19V5" />
        <path d="M4 19h16" />
        <path d="m7 15 4-4 3 3 5-7" />
        <path d="M16 7h3v3" />
      </svg>
    ),
  },
  {
    label: "Collections",
    href: "/collections",
    icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M4 7h16" />
        <path d="M4 12h16" />
        <path d="M4 17h10" />
        <path d="M18 15v4" />
        <path d="M16 17h4" />
      </svg>
    ),
  },
  {
    label: "Receivables",
    href: "/receivables",
    icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M4 7h16" />
        <path d="M4 17h16" />
        <path d="M7 7v10" />
        <path d="M17 7v10" />
        <path d="M9.5 12h5" />
      </svg>
    ),
  },
  {
    label: "Daily digest",
    href: "/daily-digest",
    icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M4 5h16" />
        <path d="M4 12h10" />
        <path d="M4 19h16" />
        <path d="M17 10l2 2-2 2" />
      </svg>
    ),
  },
  {
    label: "Financials",
    href: "/financials",
    icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M4 19V5" />
        <path d="M8 16v-5" />
        <path d="M12 16V8" />
        <path d="M16 16v-7" />
        <path d="M20 19H4" />
      </svg>
    ),
  },
  {
    label: "Asset watch",
    href: "/asset-watch",
    icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 3 4 7v6c0 4 3.5 7 8 8 4.5-1 8-4 8-8V7l-8-4Z" />
        <path d="M9 12h6" />
        <path d="M12 9v6" />
      </svg>
    ),
  },
  {
    label: "Vacancy",
    href: "/vacancy",
    icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M4 21V5l8-3 8 3v16" />
        <path d="M9 21v-7h6v7" />
        <path d="M8 8h.01" />
        <path d="M16 8h.01" />
      </svg>
    ),
  },
  {
    label: "Manager scorecards",
    href: "/manager-scorecards",
    icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M16 21v-2a4 4 0 0 0-8 0v2" />
        <circle cx="12" cy="7" r="4" />
        <path d="M20 8v6" />
        <path d="M17 11h6" />
      </svg>
    ),
  },
  {
    label: "Delinquency review",
    href: "/delinquency",
    icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 3 2.5 20h19L12 3Z" />
        <path d="M12 10v4" />
        <path d="M12 17.5h.01" />
      </svg>
    ),
  },
  {
    label: "POV notices",
    href: "/pov-notices",
    icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M6 2.5h8l4 4V21a.5.5 0 0 1-.5.5h-11A.5.5 0 0 1 6 21V2.5Z" />
        <path d="M14 2.5v4h4" />
        <path d="M9 13h6" />
        <path d="M9 16.5h6" />
      </svg>
    ),
  },
  {
    label: "Reports",
    href: "/reports",
    icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M4 4v16h16" />
        <path d="M8 16v-4" />
        <path d="M12 16V8" />
        <path d="M16 16v-6" />
      </svg>
    ),
  },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function HubSidebar() {
  // Defaults to expanded per the V1 decision.
  const [expanded, setExpanded] = useState(true);
  const pathname = usePathname();

  // The sign-in page stands on its own; no navigation until you're in.
  if (pathname === "/login") return null;

  return (
    <aside
      className={`flex h-screen flex-col bg-navy text-white transition-[width] duration-200 ease-in-out ${
        expanded ? "w-64" : "w-[68px]"
      }`}
    >
      <div className="flex items-center gap-3 px-4 py-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white/10 font-heading text-lg font-semibold">
          M
        </div>
        {expanded && (
          <span className="font-heading text-lg font-semibold leading-tight">
            Milestone AI
          </span>
        )}
      </div>

      <nav className="flex-1 space-y-1 px-2 py-2">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={expanded ? undefined : item.label}
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-white/15 text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {expanded && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <form action="/api/auth/logout" method="post" className="mx-2">
        <button
          type="submit"
          title={expanded ? undefined : "Sign out"}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M15 4h3.5a.5.5 0 0 1 .5.5v15a.5.5 0 0 1-.5.5H15" />
            <path d="M10 16l-4-4 4-4" />
            <path d="M6 12h10" />
          </svg>
          {expanded && <span>Sign out</span>}
        </button>
      </form>

      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
        aria-expanded={expanded}
        className="m-2 flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
      >
        <svg
          className={`h-5 w-5 shrink-0 transition-transform duration-200 ${expanded ? "" : "rotate-180"}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
        {expanded && <span>Collapse</span>}
      </button>
    </aside>
  );
}
