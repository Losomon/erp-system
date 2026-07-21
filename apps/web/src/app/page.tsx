import Link from "next/link";
import type { ApiHealthResponse } from "@atelier/types";

async function getHealth() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
  try {
    const res = await fetch(`${apiUrl}/api/health`, { cache: "no-store" });
    if (!res.ok) throw new Error(`API returned ${res.status}`);
    return (await res.json()) as ApiHealthResponse & { database: string };
  } catch {
    return null;
  }
}

export default async function Home() {
  const health = await getHealth();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-atelier-slate">
          Atelier ERP
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-atelier-ink">
          Foundation is running
        </h1>
        <p className="mt-3 max-w-md text-sm text-atelier-slate">
          Step 1 (infrastructure) and Step 2 (identity &amp; security) are in
          place. The real ERP dashboard replaces this page in Step 3.
        </p>
      </div>

      <div className="rounded-lg border border-atelier-slate/20 bg-white px-6 py-4 text-left text-sm shadow-sm">
        <p>
          <span className="font-medium">API status:</span>{" "}
          {health ? health.status : "unreachable"}
        </p>
        <p>
          <span className="font-medium">Database:</span>{" "}
          {health ? health.database : "unknown"}
        </p>
        <p>
          <span className="font-medium">Checked at:</span>{" "}
          {health ? new Date(health.timestamp).toLocaleString() : "—"}
        </p>
      </div>

      <div className="flex gap-3">
        <Link
          href="/register"
          className="rounded-md bg-atelier-ink px-4 py-2 text-sm font-medium text-white hover:bg-atelier-slate"
        >
          Create account
        </Link>
        <Link
          href="/login"
          className="rounded-md border border-atelier-slate/25 px-4 py-2 text-sm font-medium text-atelier-ink hover:bg-atelier-slate/5"
        >
          Sign in
        </Link>
      </div>
    </main>
  );
}
