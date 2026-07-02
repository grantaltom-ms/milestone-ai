'use client';

function toggleSidebar() {
  const el = document.getElementById('hub-sidebar');
  if (!el) return;
  el.dataset.collapsed = el.dataset.collapsed === 'true' ? 'false' : 'true';
}

export function SidebarHideButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={toggleSidebar}
      className={className}
      aria-label="Collapse sidebar"
    >
      Hide
    </button>
  );
}

export function SidebarShowButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={toggleSidebar}
      className={className}
      aria-label="Expand sidebar"
    >
      Show
    </button>
  );
}
