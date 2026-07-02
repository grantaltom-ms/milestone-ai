'use client';

export function LogoutButton() {
  return (
    <form action="/api/auth/logout" method="post">
      <button
        type="submit"
        className="rounded-md border border-ink/8 bg-white px-3 py-2 text-xs text-ink/60 hover:bg-paper"
      >
        Log out
      </button>
    </form>
  );
}
