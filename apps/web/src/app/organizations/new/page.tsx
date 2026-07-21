"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "../../../components/protected-route";
import { useAuth } from "../../../context/auth-context";
import { api, ApiError } from "../../../lib/api-client";
import { AuthCard, buttonClass, inputClass, labelClass } from "../../../components/auth-card";

function NewOrganizationForm() {
  const router = useRouter();
  const { refreshUser } = useAuth();

  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.createOrganization(name);
      await refreshUser();
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthCard
      eyebrow="Step 2 of 2"
      title="Create your organization"
      subtitle="This is the company or team your ERP data will belong to. You'll be the Owner."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Organization name</label>
          <input
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Atelier Textiles Ltd"
            required
            minLength={2}
            autoFocus
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" className={buttonClass} disabled={submitting}>
          {submitting ? "Creating organization…" : "Create organization"}
        </button>
      </form>
    </AuthCard>
  );
}

export default function NewOrganizationPage() {
  return (
    <ProtectedRoute>
      <NewOrganizationForm />
    </ProtectedRoute>
  );
}
