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
    <main className="flex min-h-screen flex-col items-center justify-center p-6 relative overflow-hidden bg-background">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground select-none">
            Culture<span className="text-accent">Trail</span>
          </h1>
          <p className="text-sm text-foreground/60">Sign in to continue</p>
        </div>

        {/* Login Card */}
        <div className="bg-foreground/[0.02] border border-foreground/10 rounded-2xl p-8 backdrop-blur-md shadow-2xl space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
            {/* Username */}
            <div className="space-y-2">
              <label
                htmlFor="username"
                className="block text-sm font-semibold tracking-wide text-foreground"
              >
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
                className="w-full px-4 py-3 bg-[#1A1714] border border-stone-700 rounded-xl text-[#F5EFE6] placeholder-foreground/40 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-sm font-semibold tracking-wide text-foreground"
              >
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
                className="w-full px-4 py-3 bg-[#1A1714] border border-stone-700 rounded-xl text-[#F5EFE6] placeholder-foreground/40 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Error message */}
            {error && (
              <div
                className="text-red-400 text-sm font-medium bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center"
                role="alert"
              >
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading || !username.trim() || !password}
              className={`w-full py-3.5 px-6 rounded-xl font-bold tracking-wide transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                !isLoading && username.trim() && password
                  ? "bg-accent text-background hover:bg-[#C55B2E] cursor-pointer active:scale-[0.99]"
                  : "bg-foreground/5 text-foreground/30 border border-foreground/10 cursor-not-allowed"
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4 text-background"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Signing in...
                </span>
              ) : (
                "Log in"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-foreground/30">
          CultureTrail &bull; Hackathon Demo
        </p>
      </div>
    </main>
  );
}
