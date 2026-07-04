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
    "Scouting cultural events..."
  ];
  const [loadingMessageIdx, setLoadingMessageIdx] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      setLoadingMessageIdx(0);
      return;
    }
    const interval = setInterval(() => {
      setLoadingMessageIdx((prev) => (prev + 1) % loadingMessages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [isLoading, loadingMessages.length]);

  const handleInterestToggle = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!destination.trim() || interests.length === 0 || isLoading) return;
    
    setIsLoading(true);
    setApiError(null);

    try {
      const response = await fetch("/api/generate-guide", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          destination: destination.trim(),
          days,
          interests,
          notes: notes.trim(),
        }),
      });

      if (!response.ok) {
        let errorMessage = "Failed to generate guide.";
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
    <main className="flex min-h-screen flex-col items-center justify-start p-6 relative overflow-hidden bg-background">
      {/* Decorative gradient background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] md:w-[600px] h-[350px] md:h-[600px] bg-accent/10 rounded-full blur-[80px] md:blur-[120px] pointer-events-none" />

      {/* Top bar: Log out */}
      <div className="absolute top-4 right-6 z-50">
        <a
          href="/api/auth/logout"
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full border border-foreground/20 text-foreground/70 hover:bg-foreground/5 hover:border-foreground/40 hover:text-foreground transition-all select-none"
        >
          Log out
        </a>
      </div>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center min-h-screen w-full relative z-10 py-12">
        <div className="max-w-2xl mx-auto space-y-6 text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground select-none">
            Culture<span className="text-accent bg-clip-text text-transparent bg-gradient-to-r from-accent to-[#F29F67]">Trail</span>
          </h1>
          <p className="text-lg md:text-xl text-foreground/80 font-medium tracking-wide max-w-md mx-auto leading-relaxed">
            Discover destinations. Live the culture.
          </p>
          
          {/* Decorative divider */}
          <div className="w-24 h-1 bg-gradient-to-r from-transparent via-accent to-transparent mx-auto rounded-full opacity-60" />

          {/* Get Started CTA Button */}
          <div className="pt-4">
            <button
              onClick={scrollToForm}
              className="inline-flex items-center justify-center px-8 py-3 text-base font-semibold rounded-full bg-accent text-background transition-all duration-300 hover:bg-[#C55B2E] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer select-none active:scale-[0.98]"
            >
              Get Started
            </button>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section
        id="start"
        className="relative z-10 w-full max-w-[600px] px-4 py-16 md:py-24"
      >
        <div className="w-full bg-foreground/[0.02] border border-foreground/10 rounded-2xl p-4 sm:p-6 md:p-8 backdrop-blur-md shadow-2xl">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground text-center mb-2">
            Plan Your Journey
          </h2>
          <p className="text-sm md:text-base text-foreground/60 text-center mb-8">
            Tell us about your trip to generate a personalized cultural guide.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6 text-left" autoComplete="off">
            {/* Destination Field */}
            <div className="space-y-2">
              <label
                htmlFor="destination"
                className="block text-sm font-semibold tracking-wide text-foreground"
              >
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
                className="w-full px-4 py-3 bg-[#1A1714] border border-stone-700 rounded-xl text-[#F5EFE6] placeholder-foreground/60 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Trip Length Field */}
            <div className="space-y-2">
              <label
                htmlFor="days"
                className="block text-sm font-semibold tracking-wide text-foreground"
              >
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
                className="w-full px-4 py-3 bg-[#1A1714] border border-stone-700 rounded-xl text-[#F5EFE6] opacity-100 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Interests Field */}
            <fieldset className="space-y-3">
              <legend className="text-sm font-semibold tracking-wide text-foreground">
                Interests <span className="text-accent">*</span> <span className="text-xs text-foreground/50 font-normal">(Select at least one)</span>
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
                      className={`px-4 py-2 text-sm font-medium rounded-full border transition-all duration-200 select-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                        isSelected
                          ? "bg-accent border-accent text-background font-semibold hover:bg-[#C55B2E]"
                          : "bg-[#1A1714] border-stone-700 text-[#F5EFE6]/80 hover:text-[#F5EFE6] hover:border-stone-600 hover:bg-[#221F1C]"
                      } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {interest}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {/* Notes Field */}
            <div className="space-y-2">
              <label
                htmlFor="notes"
                className="block text-sm font-semibold tracking-wide text-foreground"
              >
                {"Anything specific you're curious about?"} <span className="text-xs text-foreground/50 font-normal">(Optional)</span>
              </label>
              <textarea
                id="notes"
                rows={4}
                disabled={isLoading}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. I love street food, want to avoid touristy spots"
                className="w-full px-4 py-3 bg-[#1A1714] border border-stone-700 rounded-xl text-[#F5EFE6] placeholder-foreground/60 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors focus-visible:ring-2 focus-visible:ring-accent resize-y disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Inline Error Message */}
            {apiError && (
              <div
                className="text-red-400 text-sm font-medium bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center"
                role="alert"
              >
                {apiError}
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={!isFormValid}
                aria-disabled={!isFormValid}
                className={`w-full py-4 px-6 rounded-xl font-bold tracking-wide transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  isFormValid
                    ? "bg-accent text-background hover:bg-[#C55B2E] cursor-pointer active:scale-[0.99]"
                    : "bg-foreground/5 text-foreground/30 border border-foreground/10 cursor-not-allowed"
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-background" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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
