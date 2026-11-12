"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, LogIn } from "lucide-react";
import { Cat } from "@/components/mascot/Cat";
import { Button } from "@/components/ui/button";

function LoginForm() {
  const params = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(false);
    try {
      const res = await fetch("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) });
      if (res.ok) {
        const next = params.get("next");
        window.location.href = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
        return;
      }
      setError(true);
    } catch {
      setError(true);
    }
    setBusy(false);
  };

  const input = "h-12 w-full rounded-2xl border-2 border-border bg-secondary px-4 text-base font-semibold focus-visible:border-primary focus-visible:outline-none";
  return (
    <form onSubmit={submit} className="flex w-full max-w-sm flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm font-bold">
        Username
        <input className={input} value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoCapitalize="none" autoCorrect="off" required />
      </label>
      <label className="flex flex-col gap-1 text-sm font-bold">
        Password
        <input className={input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
      </label>
      {error && <p className="text-sm font-bold text-destructive">That didn&apos;t match. Try again.</p>}
      <Button type="submit" variant="lime" size="lg" disabled={busy}>
        {busy ? <Loader2 className="animate-spin" /> : <LogIn />} Sign in
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-5 px-4">
      <Cat mood="idle" size={110} />
      <h1 className="text-3xl font-black">
        Harmonic<span className="text-lime">Cat</span>
      </h1>
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
