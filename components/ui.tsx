import Link from "next/link";

export function Nav() {
  return (
    <nav className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold text-white">
          PersonalBot
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/auth/login"
            className="text-sm text-zinc-400 hover:text-white"
          >
            Log in
          </Link>
          <Link
            href="/auth/signup"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            Get started
          </Link>
        </div>
      </div>
    </nav>
  );
}

export function DashboardNav({ email }: { email: string }) {
  return (
    <nav className="border-b border-zinc-800 bg-zinc-950">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/dashboard" className="text-lg font-semibold text-white">
          PersonalBot
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-zinc-500">{email}</span>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="text-sm text-zinc-400 hover:text-white"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </nav>
  );
}

export function Card({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 ${className}`}
    >
      <h2 className="mb-4 text-lg font-medium text-white">{title}</h2>
      {children}
    </section>
  );
}

export function Input({
  label,
  name,
  defaultValue,
  placeholder,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm text-zinc-400">{label}</span>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none"
      />
    </label>
  );
}

export function Textarea({
  label,
  name,
  defaultValue,
  placeholder,
  rows = 3,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm text-zinc-400">{label}</span>
      <textarea
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        rows={rows}
        className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none"
      />
    </label>
  );
}

export function Button({
  children,
  type = "submit",
  variant = "primary",
  className = "",
  onClick,
}: {
  children: React.ReactNode;
  type?: "submit" | "button";
  variant?: "primary" | "secondary" | "danger";
  className?: string;
  onClick?: () => void | Promise<void>;
}) {
  const variants = {
    primary: "bg-indigo-600 hover:bg-indigo-500 text-white",
    secondary:
      "border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-200",
    danger: "bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-900",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      className={`rounded-lg px-4 py-2 text-sm font-medium transition ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950 p-4 text-sm text-emerald-400">
      <code>{code}</code>
    </pre>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    completed: "bg-emerald-500/20 text-emerald-400",
    active: "bg-blue-500/20 text-blue-400",
    pending: "bg-yellow-500/20 text-yellow-400",
    processing: "bg-indigo-500/20 text-indigo-400",
    failed: "bg-red-500/20 text-red-400",
  };

  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] ?? "bg-zinc-700 text-zinc-300"}`}
    >
      {status}
    </span>
  );
}
