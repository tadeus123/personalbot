"use client";

import { useState } from "react";
import { Button, Card, StatusBadge } from "@/components/ui";

export function InstructForm() {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/instruct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setResult(data.result ?? data);
      setContent("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card title="Give your bot an instruction">
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block space-y-1.5">
          <span className="text-sm text-zinc-400">
            What should your bot do?
          </span>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder='e.g. "Schedule a meeting with Constantine next week for 30 minutes"'
            rows={3}
            required
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none"
          />
        </label>
        <Button type="submit" className={loading ? "opacity-50" : ""}>
          {loading ? "Your bot is working..." : "Send instruction"}
        </Button>
      </form>

      {error && (
        <p className="mt-4 rounded-lg border border-red-900 bg-red-950/50 p-3 text-sm text-red-400">
          {error}
        </p>
      )}

      {result && (
        <div className="mt-4 space-y-2 rounded-lg border border-zinc-800 bg-zinc-950 p-4">
          <div className="flex items-center gap-2">
            <StatusBadge
              status={result.success ? "completed" : "failed"}
            />
            <span className="text-sm text-zinc-300">
              {String(result.message ?? "Done")}
            </span>
          </div>
          {result.proposed_time != null && (
            <p className="text-sm text-emerald-400">
              Agreed time: {String(result.proposed_time)}
            </p>
          )}
          {result.conversation_id != null && (
            <p className="text-xs text-zinc-500">
              Conversation: {String(result.conversation_id)}
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
