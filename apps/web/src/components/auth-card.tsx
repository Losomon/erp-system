export function AuthCard({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <p className="text-center text-xs uppercase tracking-[0.2em] text-atelier-slate">
          {eyebrow}
        </p>
        <h1 className="mt-2 text-center text-2xl font-semibold text-atelier-ink">{title}</h1>
        {subtitle && (
          <p className="mt-2 text-center text-sm text-atelier-slate">{subtitle}</p>
        )}
        <div className="mt-8 rounded-xl border border-atelier-slate/15 bg-white p-6 shadow-sm">
          {children}
        </div>
      </div>
    </main>
  );
}

export const inputClass =
  "w-full rounded-md border border-atelier-slate/25 bg-white px-3 py-2 text-sm text-atelier-ink outline-none focus:border-atelier-brass focus:ring-1 focus:ring-atelier-brass";

export const buttonClass =
  "w-full rounded-md bg-atelier-ink px-3 py-2 text-sm font-medium text-white transition hover:bg-atelier-slate disabled:cursor-not-allowed disabled:opacity-50";

export const labelClass = "mb-1 block text-xs font-medium text-atelier-slate";
