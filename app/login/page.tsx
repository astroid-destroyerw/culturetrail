"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      if (response.ok) {
        router.push("/");
        router.refresh();
      } else {
        setError("Invalid credentials. Please try again.");
        setIsLoading(false);
      }
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 relative overflow-hidden bg-background">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent/8 rounded-full blur-[150px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="text-center space-y-1.5">
          <h1 className="text-3xl font-bold tracking-tight text-foreground select-none">
            Culture<span className="bg-clip-text text-transparent bg-gradient-to-r from-accent to-[#E8905E]">Trail</span>
          </h1>
          <p className="text-sm text-foreground/45">Sign in to continue</p>
        </div>

        {/* Card */}
        <div className="bg-surface-1 rounded-2xl p-8 shadow-lg border border-[var(--border)] space-y-5">
          <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
            {/* Username */}
            <div className="space-y-2">
              <label htmlFor="username" className="block text-sm font-medium text-foreground/75">
                Username
              </label>
              <input
                type="text"
                id="username"
                required
                disabled={isLoading}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                autoComplete="username"
                className="w-full px-4 py-3 bg-surface-2 rounded-xl text-foreground placeholder-foreground/35 border border-[var(--border)] focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/40 transition-all disabled:opacity-40"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-foreground/75">
                Password
              </label>
              <input
                type="password"
                id="password"
                required
                disabled={isLoading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                className="w-full px-4 py-3 bg-surface-2 rounded-xl text-foreground placeholder-foreground/35 border border-[var(--border)] focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/40 transition-all disabled:opacity-40"
              />
            </div>

            {/* Error */}
            {error && (
              <div
                className="text-red-400/90 text-sm bg-red-500/8 border border-red-500/15 rounded-xl p-3.5 text-center leading-relaxed"
                role="alert"
              >
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading || !username.trim() || !password}
              className={`w-full py-3.5 px-6 rounded-xl font-semibold transition-all duration-300 ${
                !isLoading && username.trim() && password
                  ? "bg-accent text-background hover:brightness-110 hover:shadow-accent cursor-pointer active:scale-[0.99] shadow-md"
                  : "bg-foreground/5 text-foreground/25 cursor-not-allowed"
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2.5">
                  <svg className="animate-spin h-4 w-4 text-background" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                "Log in"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-foreground/25">
          CultureTrail &bull; Hackathon Demo
        </p>
      </div>
    </main>
  );
}
