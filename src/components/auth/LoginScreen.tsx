"use client";

import { useState } from "react";
import { Lock, Mail, KeyRound, ShieldAlert, ArrowRight } from "lucide-react";

interface LoginModalProps {
  onSuccess: () => void;
}

export default function LoginScreen({ onSuccess }: LoginModalProps) {
  const [username, setUsername] = useState("admin@danibrothers.com");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Invalid email or password");
      }

      localStorage.setItem("danibro_logged_in", "true");
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Box */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-[#0f172a]">
          <div className="flex flex-col items-center text-center">
            {/* Logo */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logodanibro.svg"
              alt="Danibro Logo"
              className="h-12 w-auto object-contain"
            />
            <h1 className="mt-5 text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Petty Cash Management
            </h1>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Authorized admin access for internal bookkeeping
            </p>
          </div>

          {error && (
            <div className="mt-5 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-600 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-900/40 dark:text-rose-400">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin@danibrothers.com"
                  className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3.5 py-2.5 text-xs font-medium text-slate-900 placeholder-slate-400 focus:border-[#2041ce] focus:outline-none focus:ring-2 focus:ring-[#2041ce]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3.5 py-2.5 text-xs font-medium text-slate-900 placeholder-slate-400 focus:border-[#2041ce] focus:outline-none focus:ring-2 focus:ring-[#2041ce]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2041ce] py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2041ce] disabled:opacity-50"
            >
              <span>{loading ? "Authenticating..." : "Sign In to Dashboard"}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>

          <div className="mt-6 rounded-xl bg-slate-50 p-3 text-center text-xs text-slate-500 border border-slate-100 dark:bg-slate-800/40 dark:border-slate-800">
            Default Password: <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono">danibro123</span>
          </div>
        </div>
      </div>
    </div>
  );
}
