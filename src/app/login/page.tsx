import LoginForm from "./LoginForm";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const rawNext = searchParams.next;
  const next = typeof rawNext === "string" && rawNext.startsWith("/") ? rawNext : "/";

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-6">
      <div className="w-full max-w-sm">
        <p className="ms-eyebrow">Milestone AI</p>
        <h1 className="mt-2 font-heading text-3xl font-semibold text-navy">
          Sign in
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          Enter the admin password to open the internal hub.
        </p>
        <div className="mt-6">
          <LoginForm next={next} />
        </div>
      </div>
    </div>
  );
}
