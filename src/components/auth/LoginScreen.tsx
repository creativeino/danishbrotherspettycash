"use client";

import { useState } from "react";
import { User, KeyRound, ShieldAlert, ArrowRight, UserCheck } from "lucide-react";

interface LoginModalProps {
  onSuccess: (user: { username: string; name: string; role: "ADMIN" | "OPERATOR" }) => void;
}

const PRESET_USERS = [
  { username: "danish", label: "Danish (Admin/Owner)", role: "ADMIN", defaultPass: "danibro123" },
  { username: "wahab", label: "Wahab (Operator)", role: "OPERATOR", defaultPass: "wahab123" },
  { username: "subhan", label: "Subhan (Operator)", role: "OPERATOR", defaultPass: "subhan123" },
];

export default function LoginScreen({ onSuccess }: LoginModalProps) {
  const [username, setUsername] = useState("danish");
  const [password, setPassword] = useState("danibro123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSelectPreset = (preset: typeof PRESET_USERS[0]) => {
    setUsername(preset.username);
    setPassword(preset.defaultPass);
    setError("");
  };

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
        throw new Error(data.error || "Login failed");
      }

      localStorage.setItem("danibro_logged_in", "true");
      localStorage.setItem("danibro_user", JSON.stringify(data.user));
      onSuccess(data.user);
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
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
              Select or enter username to sign in
            </p>
          </div>

          {/* Quick User Picker */}
          <div className="mt-5 space-y-1.5">
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Quick Select Account
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PRESET_USERS.map((u) => {
                const isSelected = username.toLowerCase() === u.username.toLowerCase();
                return (
                  <button
                    key={u.username}
                    type="button"
                    onClick={() => handleSelectPreset(u)}
                    className={`flex flex-col items-center justify-center rounded-xl border p-2 text-center transition ${
                      isSelected
                        ? "border-[#2041ce] bg-blue-50/50 text-[#2041ce] dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-400 font-semibold shadow-xs"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
                    }`}
                  >
                    <span className="text-xs capitalize">{u.username}</span>
                    <span className="text-[10px] opacity-75 font-normal">
                      {u.role === "ADMIN" ? "Admin" : "Operator"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="mt-5 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-600 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-900/40 dark:text-rose-400">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. danish, wahab, subhan"
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
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2041ce] py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2041ce] disabled:opacity-50 cursor-pointer"
            >
              <UserCheck className="h-4 w-4" />
              <span>{loading ? "Verifying..." : `Sign In as ${username || "User"}`}</span>
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </button>
          </form>

          <div className="mt-5 rounded-xl bg-slate-50 p-3 text-xs text-slate-500 border border-slate-100 dark:bg-slate-800/40 dark:border-slate-800 space-y-1">
            <div className="font-semibold text-slate-700 dark:text-slate-300">Default Access:</div>
            <div>• <span className="font-mono font-medium">danish</span> (Admin) - pass: <span className="font-mono">danibro123</span></div>
            <div>• <span className="font-mono font-medium">wahab</span> (Operator) - pass: <span className="font-mono">wahab123</span></div>
            <div>• <span className="font-mono font-medium">subhan</span> (Operator) - pass: <span className="font-mono">subhan123</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
