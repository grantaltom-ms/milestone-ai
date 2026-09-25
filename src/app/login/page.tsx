import { safeNextPath } from "@/lib/auth";
import LoginForm from "./LoginForm";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const next = safeNextPath(searchParams.next);

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-6">
      <div className="w-full max-w-sm">
        <p className="ms-eyebrow">Milestone AI</p>
        <h1 className="mt-2 font-heading text-3xl font-semibold text-navy">Sign in</h1>
        <p className="mt-2 text-sm text-ink-muted">Enter the Hub password to continue.</p>
        <div className="mt-6">
          <LoginForm next={next} />
        </div>
      </div>
    </div>
  );
}
