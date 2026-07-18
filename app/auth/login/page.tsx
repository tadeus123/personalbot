"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md">
        <Link href="/" className="text-lg font-semibold text-white">
          PersonalBot
        </Link>
        <h1 className="mt-8 text-2xl font-bold text-white">Welcome back</h1>
        <p className="mt-2 text-zinc-500">Log in to manage your personal bot</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <label className="block space-y-1.5">
            <span className="text-sm text-zinc-400">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm text-zinc-400">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
            />
          </label>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <Button type="submit" className={`w-full ${loading ? "opacity-50" : ""}`}>
            {loading ? "Logging in..." : "Log in"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          No account?{" "}
          <Link href="/auth/signup" className="text-indigo-400 hover:text-indigo-300">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
