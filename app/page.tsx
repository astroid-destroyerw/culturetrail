"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

const LOADING_MESSAGES = [
  "Discovering cultural details...",
  "Uncovering hidden gems...",
  "Weaving local stories...",
  "Mapping heritage sites...",
  "Scouting cultural events...",
];

const INTERESTS = [
  "Heritage & History",
  "Food & Cuisine",
  "Nature & Outdoors",
  "Art & Design",
  "Nightlife & Music",
  "Local Markets",
  "Festivals & Events",
];

export default function Home() {
  const router = useRouter();
  const [showForm, setShowForm]       = useState(false);
  const [destination, setDestination] = useState("");
  const [days, setDays]               = useState(3);
  const [interests, setInterests]     = useState<string[]>([]);
  const [notes, setNotes]             = useState("");
  const [isLoading, setIsLoading]     = useState(false);
  const [apiError, setApiError]       = useState<string | null>(null);
  const [loadingIdx, setLoadingIdx]   = useState(0);

  /* Cycle loading messages while waiting */
  useEffect(() => {
    if (!isLoading) return;
    const id = setInterval(
      () => setLoadingIdx((p) => (p + 1) % LOADING_MESSAGES.length),
      2000
    );
    return () => clearInterval(id);
  }, [isLoading]);

  const toggleInterest = (i: string) =>
    setInterests((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]
    );

  const isFormValid = destination.trim() !== "" && interests.length > 0 && !isLoading;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    setIsLoading(true);
    setApiError(null);

    try {
      const res = await fetch("/api/generate-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination: destination.trim(),
          days,
          interests,
          notes: notes.trim(),
        }),
      });

      if (!res.ok) {
        const { error } = await res.json().catch(() => ({})) as { error?: string };
        setApiError(error ?? "Something went wrong. Please try again.");
        setIsLoading(false);
        return;
      }

      const data = await res.json();
      try {
        sessionStorage.setItem("cultureGuideData", JSON.stringify(data));
        sessionStorage.setItem(
          "cultureGuideParams",
          JSON.stringify({ destination: destination.trim(), days, interests, notes: notes.trim() })
        );
      } catch { /* ignore */ }

      router.push("/results");
    } catch {
      setApiError("Couldn't reach the server. Check your connection and try again.");
      setIsLoading(false);
    }
  };

  return (
    /*
     * Outer clip — exactly one viewport tall, overflow hidden.
     * Inner "reel" slides up by 100vh when showForm is true,
     * revealing the form screen below. No page scroll needed.
     */
    <div className="h-screen overflow-hidden overflow-x-hidden relative bg-background">

      {/* Ambient glow — fixed so it persists across both screens */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-accent/8 rounded-full blur-[180px]" />
        <div className="absolute top-0 right-0 w-[350px] h-[350px] bg-amber-400/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-accent/5 rounded-full blur-[100px]" />
      </div>

      {/* Log-out link — always top-right */}
      <div className="absolute top-5 right-6 z-50">
        <a
          href="/api/auth/logout"
          className="text-xs font-medium px-3.5 py-1.5 rounded-lg text-foreground/40 hover:text-foreground/70 hover:bg-surface-1 transition-all select-none"
        >
          Log out
        </a>
      </div>

      {/* ── Sliding reel ─────────────────────────────────────────── */}
      <div
        className="relative z-10 flex flex-col"
        style={{
          transform: showForm ? "translateY(-100vh)" : "translateY(0)",
          transition: "transform 0.72s cubic-bezier(0.76, 0, 0.24, 1)",
          willChange: "transform",
        }}
      >

        {/* ── Screen 1: Hero ──────────────────────────────────────── */}
        <div className="h-screen flex flex-col items-center justify-center px-8 flex-shrink-0">
          <div className="w-full max-w-lg mx-auto space-y-8 text-center">

            {/* Eyebrow */}
            <p className="text-xs font-semibold tracking-[0.25em] uppercase text-accent/70 select-none">
              AI-Powered Cultural Travel
            </p>

            {/* Logo / Wordmark — fluid size so it never clips */}
            <h1
              className="font-display font-semibold text-foreground select-none leading-[1.05] tracking-tight w-full"
              style={{ fontSize: "clamp(3rem, 10vw, 5.5rem)" }}
            >
              <span>Culture</span><span
                className="italic bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, #A0522D 0%, #C4784A 50%, #D4935C 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >Trail</span>
            </h1>

            {/* Tagline */}
            <p className="text-base text-foreground/55 leading-relaxed max-w-sm mx-auto font-light">
              Discover destinations through their culture, stories, and hidden gems — curated just for you.
            </p>

            {/* Decorative rule */}
            <div className="flex items-center justify-center gap-4">
              <div className="h-px w-12 bg-accent/20" />
              <div className="w-1 h-1 rounded-full bg-accent/30" />
              <div className="h-px w-12 bg-accent/20" />
            </div>

            {/* CTA */}
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center justify-center px-10 py-4 font-display font-semibold text-base italic rounded-xl bg-accent text-white hover:brightness-105 hover:shadow-accent transition-all duration-300 shadow-md cursor-pointer select-none active:scale-[0.98] tracking-wide"
            >
              Begin Your Journey
            </button>

            {/* Social proof hint */}
            <p className="text-xs text-foreground/30 tracking-wide select-none">
              Real places · Real coordinates · AI woven stories
            </p>
          </div>
        </div>

        {/* ── Screen 2: Form ──────────────────────────────────────── */}
        <div className="h-screen flex-shrink-0 overflow-y-auto">
          <div className="min-h-full flex flex-col items-center justify-center px-4 py-16">
            <div className="w-full max-w-[560px]">

              {/* Back to hero */}
              <button
                onClick={() => setShowForm(false)}
                className="flex items-center gap-1.5 text-xs font-medium text-foreground/45 hover:text-foreground/70 transition-colors mb-8 cursor-pointer select-none group"
                aria-label="Back to home"
              >
                <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
                Back
              </button>

              {/* Form card */}
              <div className="bg-surface-1 rounded-2xl p-7 md:p-10 shadow-card border border-[var(--border)]">
                <div className="mb-8 space-y-1.5">
                  <h2 className="font-display text-2xl md:text-3xl font-semibold text-foreground tracking-tight">
                    Plan Your Journey
                  </h2>
                  <p className="text-sm text-foreground/50 leading-relaxed">
                    Tell us where you&apos;re headed and we&apos;ll build your cultural guide.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">

                  {/* Destination */}
                  <div className="space-y-2">
                    <label htmlFor="destination" className="block text-sm font-medium text-foreground/70">
                      Destination <span className="text-accent">*</span>
                    </label>
                    <input
                      type="text"
                      id="destination"
                      required
                      disabled={isLoading}
                      autoComplete="off"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      placeholder="e.g. Kyoto, Jaipur, Lisbon…"
                      className="w-full px-4 py-3 bg-surface-2 rounded-xl text-foreground placeholder-foreground/30 border border-[var(--border)] focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/30 transition-all disabled:opacity-40"
                    />
                  </div>

                  {/* Days */}
                  <div className="space-y-2">
                    <label htmlFor="days" className="block text-sm font-medium text-foreground/70">
                      How many days? <span className="text-accent">*</span>
                    </label>
                    <input
                      type="number"
                      id="days"
                      required
                      disabled={isLoading}
                      min={1}
                      max={30}
                      value={days}
                      onChange={(e) => setDays(parseInt(e.target.value) || 1)}
                      className="w-full px-4 py-3 bg-surface-2 rounded-xl text-foreground border border-[var(--border)] focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/30 transition-all disabled:opacity-40"
                    />
                  </div>

                  {/* Interests */}
                  <fieldset className="space-y-3">
                    <legend className="text-sm font-medium text-foreground/70">
                      Interests <span className="text-accent">*</span>{" "}
                      <span className="text-xs text-foreground/35 font-normal">(Select at least one)</span>
                    </legend>
                    <div className="flex flex-wrap gap-2">
                      {INTERESTS.map((interest) => {
                        const sel = interests.includes(interest);
                        return (
                          <button
                            key={interest}
                            type="button"
                            disabled={isLoading}
                            aria-pressed={sel}
                            onClick={() => toggleInterest(interest)}
                            className={`px-3.5 py-1.5 text-sm rounded-lg border transition-all duration-200 select-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                              sel
                                ? "bg-accent/90 border-accent/50 text-white font-medium shadow-sm"
                                : "bg-surface-2 border-[var(--border)] text-foreground/60 hover:text-foreground/85 hover:border-[var(--border-hover)] hover:bg-surface-3"
                            } ${isLoading ? "opacity-40 cursor-not-allowed" : ""}`}
                          >
                            {interest}
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>

                  {/* Notes */}
                  <div className="space-y-2">
                    <label htmlFor="notes" className="block text-sm font-medium text-foreground/70">
                      Anything specific?{" "}
                      <span className="text-xs text-foreground/35 font-normal">(Optional)</span>
                    </label>
                    <textarea
                      id="notes"
                      rows={3}
                      disabled={isLoading}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. I love street food, want to avoid touristy spots…"
                      className="w-full px-4 py-3 bg-surface-2 rounded-xl text-foreground placeholder-foreground/30 border border-[var(--border)] focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/30 transition-all resize-y disabled:opacity-40"
                    />
                  </div>

                  {/* Error */}
                  {apiError && (
                    <div
                      className="text-red-700 text-sm bg-red-50 border border-red-200 rounded-xl p-3.5 text-center leading-relaxed"
                      role="alert"
                    >
                      {apiError}
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={!isFormValid}
                    className={`w-full py-3.5 rounded-xl font-display font-semibold italic text-base tracking-wide transition-all duration-300 ${
                      isFormValid
                        ? "bg-accent text-white hover:brightness-105 hover:shadow-accent cursor-pointer active:scale-[0.99] shadow-md"
                        : "bg-foreground/8 text-foreground/25 cursor-not-allowed"
                    }`}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2.5 not-italic font-sans font-medium text-sm">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        {LOADING_MESSAGES[loadingIdx]}
                      </span>
                    ) : (
                      "Discover"
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>

      </div>{/* end reel */}
    </div>
  );
}
