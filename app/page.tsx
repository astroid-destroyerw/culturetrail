"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [destination, setDestination] = useState("");
  const [days, setDays] = useState(3);
  const [interests, setInterests] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const availableInterests = [
    "Heritage & History",
    "Food & Cuisine",
    "Nature & Outdoors",
    "Art & Design",
    "Nightlife & Music",
    "Local Markets",
    "Festivals & Events",
  ];

  const loadingMessages = [
    "Discovering cultural details...",
    "Uncovering hidden gems...",
    "Weaving local stories...",
    "Mapping heritage sites...",
    "Scouting cultural events...",
  ];

  const [loadingMessageIdx, setLoadingMessageIdx] = useState(0);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingMessageIdx((prev) => (prev + 1) % loadingMessages.length);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleInterestToggle = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setIsLoading(true);
    setApiError(null);

    try {
      const response = await fetch("/api/generate-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination: destination.trim(),
          days,
          interests,
          notes: notes.trim(),
        }),
      });

      if (!response.ok) {
        let errorMessage = "Something went wrong. Please try again.";
        try {
          const errorData = await response.json();
          if (errorData && errorData.error) {
            errorMessage = errorData.error;
          }
        } catch {
          // ignore parsing error, use default message
        }
        setApiError(errorMessage);
        setIsLoading(false);
        return;
      }

      const data = await response.json();

      try {
        sessionStorage.setItem("cultureGuideData", JSON.stringify(data));
        sessionStorage.setItem("cultureGuideParams", JSON.stringify({
          destination: destination.trim(),
          days,
          interests,
          notes: notes.trim(),
        }));
      } catch (err) {
        console.warn("sessionStorage is not available:", err);
      }

      router.push("/results");
    } catch (err) {
      console.error("Network error when generating guide:", err);
      setApiError("Couldn't reach the server. Check your connection and try again.");
      setIsLoading(false);
    }
  };

  const isFormValid = destination.trim() !== "" && interests.length > 0 && !isLoading;

  const scrollToForm = () => {
    const formElement = document.getElementById("start");
    if (formElement) {
      formElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-start relative overflow-hidden bg-background">
      {/* Decorative ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] md:w-[800px] h-[500px] md:h-[800px] bg-accent/8 rounded-full blur-[120px] md:blur-[180px] pointer-events-none" />

      {/* Log out — top right */}
      <div className="absolute top-5 right-6 z-50">
        <a
          href="/api/auth/logout"
          className="text-xs font-medium px-3.5 py-1.5 rounded-lg text-foreground/50 hover:text-foreground/80 hover:bg-foreground/5 transition-all select-none"
        >
          Log out
        </a>
      </div>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center min-h-screen w-full relative z-10 px-6">
        <div className="max-w-xl mx-auto space-y-7 text-center">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground select-none leading-tight">
            Culture<span className="bg-clip-text text-transparent bg-gradient-to-r from-accent to-[#E8905E]">Trail</span>
          </h1>
          <p className="text-base md:text-lg text-foreground/60 max-w-sm mx-auto leading-relaxed">
            Discover destinations. Live the culture.
          </p>

          <div className="w-16 h-px bg-accent/30 mx-auto" />

          <button
            onClick={scrollToForm}
            className="inline-flex items-center justify-center px-8 py-3.5 text-sm font-semibold rounded-xl bg-accent text-background transition-all duration-300 hover:brightness-110 hover:shadow-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer select-none active:scale-[0.98] shadow-md"
          >
            Get Started
          </button>
        </div>
      </section>

      {/* Form Section */}
      <section id="start" className="relative z-10 w-full max-w-[580px] px-4 py-20 md:py-28">
        <div className="w-full bg-surface-1 rounded-2xl p-6 md:p-8 shadow-lg border border-[var(--border)]">
          <h2 className="text-xl md:text-2xl font-semibold text-foreground text-center mb-1.5">
            Plan Your Journey
          </h2>
          <p className="text-sm text-foreground/50 text-center mb-8 leading-relaxed">
            Tell us about your trip to generate a personalized cultural guide.
          </p>

          <form onSubmit={handleSubmit} className="space-y-7 text-left" autoComplete="off">
            {/* Destination */}
            <div className="space-y-2">
              <label htmlFor="destination" className="block text-sm font-medium text-foreground/80">
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
                placeholder="Where are you headed? (e.g. Kyoto, Jaipur, Lisbon)"
                className="w-full px-4 py-3 bg-surface-2 rounded-xl text-foreground placeholder-foreground/35 border border-[var(--border)] focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/40 transition-all disabled:opacity-40"
              />
            </div>

            {/* Trip Length */}
            <div className="space-y-2">
              <label htmlFor="days" className="block text-sm font-medium text-foreground/80">
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
                className="w-full px-4 py-3 bg-surface-2 rounded-xl text-foreground border border-[var(--border)] focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/40 transition-all disabled:opacity-40"
              />
            </div>

            {/* Interests */}
            <fieldset className="space-y-3">
              <legend className="text-sm font-medium text-foreground/80">
                Interests <span className="text-accent">*</span>{" "}
                <span className="text-xs text-foreground/40 font-normal">(Select at least one)</span>
              </legend>
              <div className="flex flex-wrap gap-2">
                {availableInterests.map((interest) => {
                  const isSelected = interests.includes(interest);
                  return (
                    <button
                      key={interest}
                      type="button"
                      disabled={isLoading}
                      aria-pressed={isSelected}
                      onClick={() => handleInterestToggle(interest)}
                      className={`px-3.5 py-1.5 text-sm rounded-lg border transition-all duration-200 select-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                        isSelected
                          ? "bg-accent/90 border-accent/60 text-background font-medium shadow-accent"
                          : "bg-surface-2 border-[var(--border)] text-foreground/65 hover:text-foreground/90 hover:border-[var(--border-hover)] hover:bg-surface-3"
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
              <label htmlFor="notes" className="block text-sm font-medium text-foreground/80">
                Anything specific you&apos;re curious about?{" "}
                <span className="text-xs text-foreground/40 font-normal">(Optional)</span>
              </label>
              <textarea
                id="notes"
                rows={3}
                disabled={isLoading}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. I love street food, want to avoid touristy spots"
                className="w-full px-4 py-3 bg-surface-2 rounded-xl text-foreground placeholder-foreground/35 border border-[var(--border)] focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/40 transition-all resize-y disabled:opacity-40"
              />
            </div>

            {/* Error */}
            {apiError && (
              <div
                className="text-red-400/90 text-sm bg-red-500/8 border border-red-500/15 rounded-xl p-3.5 text-center leading-relaxed"
                role="alert"
              >
                {apiError}
              </div>
            )}

            {/* Submit */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={!isFormValid}
                aria-disabled={!isFormValid}
                className={`w-full py-3.5 px-6 rounded-xl font-semibold transition-all duration-300 ${
                  isFormValid
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
                    {loadingMessages[loadingMessageIdx]}
                  </span>
                ) : (
                  "Discover"
                )}
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
