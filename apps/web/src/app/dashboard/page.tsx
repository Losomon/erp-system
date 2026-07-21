"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "../../components/protected-route";
import { useAuth } from "../../context/auth-context";

function DashboardContent() {
  const { user, logout } = useAuth();
  const router = useRouter();

  // A brand-new account has no organizations yet — send them straight
  // into org creation rather than showing an empty dashboard.
  useEffect(() => {
    if (user && user.organizations.length === 0) {
      router.replace("/organizations/new");
    }
  }, [user, router]);

  if (!user) return null;

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-16">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-atelier-slate">Atelier ERP</p>
          <h1 className="mt-1 text-2xl font-semibold text-atelier-ink">
            Welcome, {user.firstName}
          </h1>
        </div>
        <button
          onClick={handleLogout}
          className="rounded-md border border-atelier-slate/25 px-3 py-1.5 text-sm text-atelier-slate hover:bg-atelier-slate/5"
        >
          Sign out
        </button>
      </div>

      <div className="mt-10 flex items-center justify-between">
        <h2 className="text-sm font-medium text-atelier-ink">Your organizations</h2>
        <Link
          href="/organizations/new"
          className="text-sm font-medium text-atelier-brass hover:underline"
        >
          + New organization
        </Link>
      </div>

      <ul className="mt-4 divide-y divide-atelier-slate/10 rounded-xl border border-atelier-slate/15 bg-white">
        {user.organizations.map((org) => (
          <li
            key={org.organizationId}
            className="flex items-center justify-between px-4 py-3 text-sm"
          >
            <div>
              <p className="font-medium text-atelier-ink">{org.organizationName}</p>
              <p className="text-atelier-slate">{org.organizationSlug}</p>
            </div>
            <span className="rounded-full bg-atelier-canvas px-2.5 py-1 text-xs font-medium text-atelier-slate">
              {org.roleName}
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-8 text-sm text-atelier-slate">
        CRM, products, sales, invoices, and the rest of the ERP modules arrive in Step 3 —
        this dashboard is the identity &amp; organization shell from Step 2.
      </p>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
