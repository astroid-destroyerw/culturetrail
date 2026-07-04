"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GuideResponse } from "@/types";
import { ArrowLeft, Sun, Compass, Moon, MapPin, BookOpen, SlidersHorizontal } from "lucide-react";
import dynamic from "next/dynamic";
import FadeIn from "@/components/FadeIn";
import RefineChat from "@/components/RefineChat";

const ItineraryMap = dynamic(() => import("@/components/ItineraryMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] md:h-[450px] rounded-2xl bg-foreground/5 border border-foreground/10 flex items-center justify-center animate-pulse print:hidden">
      <span className="text-sm text-foreground/50">Loading Map...</span>
    </div>
  ),
});

function ResultsSkeleton() {
  return (
    <div className="min-h-screen bg-background text-foreground animate-pulse p-6">
      <div className="border-b border-foreground/10 pb-4 mb-8 flex justify-between items-center max-w-6xl mx-auto">
        <div className="h-6 w-28 bg-foreground/10 rounded"></div>
        <div className="h-8 w-40 bg-foreground/10 rounded"></div>
        <div className="h-10 w-28 bg-foreground/10 rounded-full"></div>
      </div>
      <div className="max-w-4xl mx-auto space-y-12 pt-6">
        <div className="h-32 bg-foreground/5 rounded-xl border border-foreground/10"></div>
        <div className="flex gap-2 justify-center">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-10 w-24 bg-foreground/10 rounded-full"></div>
          ))}
        </div>
        <div className="h-[400px] bg-foreground/5 rounded-xl border border-foreground/10"></div>
        <div className="space-y-8">
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex gap-4 items-start">
              <div className="h-12 w-12 bg-foreground/10 rounded-full shrink-0"></div>
              <div className="flex-1 space-y-3">
                <div className="h-6 w-48 bg-foreground/10 rounded"></div>
                <div className="h-20 bg-foreground/5 rounded-xl border border-foreground/10"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  const router = useRouter();
  const [guideData, setGuideData] = useState<GuideResponse | null>(null);
  const [isCheckingStorage, setIsCheckingStorage] = useState(true);
  const [activeDayIdx, setActiveDayIdx] = useState(-1); // -1 = All Days
  const [isRefineOpen, setIsRefineOpen] = useState(true); // Open by default

  useEffect(() => {
    try {
      const cached = sessionStorage.getItem("cultureGuideData");
      if (!cached) { router.push("/"); return; }
      const parsed = JSON.parse(cached) as GuideResponse;
      if (!parsed || !parsed.destination) { router.push("/"); return; }
      setGuideData(parsed);
    } catch (err) {
      console.error("Error reading sessionStorage:", err);
      router.push("/");
    } finally {
      setIsCheckingStorage(false);
    }
  }, [router]);

  useEffect(() => {
    if (guideData) {
      document.title = `CultureTrail — Guide to ${guideData.destination}`;
    }
  }, [guideData]);

  const handleNewSearch = () => {
    try {
      sessionStorage.removeItem("cultureGuideData");
      sessionStorage.removeItem("cultureGuideParams");
    } catch (err) {
      console.warn("sessionStorage is not available:", err);
    }
    router.push("/");
  };

  const handleDaySelect = (idx: number) => {
    setActiveDayIdx(idx);
    if (idx >= 0) {
      const element = document.getElementById(`day-card-${idx + 1}`);
      if (element) element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Called by RefineChat when the AI returns an updated guide
  const handleGuideUpdated = (newGuide: GuideResponse) => {
    setGuideData(newGuide);
    setActiveDayIdx(-1); // Reset to "All Days" view
  };

  if (isCheckingStorage || !guideData) return <ResultsSkeleton />;

  const timesOfDay = [
    { key: "morning", label: "Morning", icon: Sun, color: "text-amber-400 border-amber-400/20" },
    { key: "afternoon", label: "Afternoon", icon: Compass, color: "text-accent border-accent/20" },
    { key: "evening", label: "Evening", icon: Moon, color: "text-indigo-400 border-indigo-400/20" },
  ] as const;

  const getTypeBadgeStyles = (type: string) => {
    switch (type.toLowerCase()) {
      case "museum":      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "historic":    return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "viewpoint":   return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "marketplace": return "bg-pink-500/10 text-pink-400 border-pink-500/20";
      case "religion":    return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "artwork":     return "bg-teal-500/10 text-teal-400 border-teal-500/20";
      default:            return "bg-stone-500/10 text-stone-400 border-stone-500/20";
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden pb-24">
      {/* Decorative background glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] md:w-[600px] h-[350px] md:h-[600px] bg-accent/5 rounded-full blur-[100px] md:blur-[150px] pointer-events-none print:hidden" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[350px] md:w-[600px] h-[350px] md:h-[600px] bg-accent/5 rounded-full blur-[100px] md:blur-[150px] pointer-events-none print:hidden" />

      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-foreground/10 shadow-lg print:hidden">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 select-none">
            <span className="text-sm md:text-base font-extrabold tracking-tight">
              Culture<span className="text-accent">Trail</span>
            </span>
          </div>

          <h1 className="text-lg md:text-2xl font-extrabold tracking-tight text-foreground truncate text-center max-w-[40%] md:max-w-[60%]">
            {guideData.destination}
          </h1>

          <div className="flex items-center gap-2">
            <button
              onClick={handleNewSearch}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs md:text-sm font-semibold rounded-full border border-accent text-accent hover:bg-accent hover:text-background transition-all duration-300 active:scale-[0.97]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              New Search
            </button>

            <a
              href="/api/auth/logout"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full border border-foreground/20 text-foreground/60 hover:bg-foreground/5 hover:border-foreground/40 hover:text-foreground transition-all select-none"
            >
              Log out
            </a>
          </div>
        </div>
      </header>

      {/* Content Stack */}
      <main className="max-w-4xl mx-auto px-4 pt-12 space-y-12 relative z-10 print:pt-4">

        {/* Print-only title */}
        <div className="hidden print:block text-center space-y-2 mb-12">
          <h1 className="text-3xl font-extrabold text-black">
            CultureTrail &mdash; {guideData.destination}
          </h1>
          <p className="text-sm text-gray-600">Your curated AI-powered grounded cultural guide</p>
        </div>

        {/* Wikipedia Summary */}
        {guideData.wikiSummary && (
          <FadeIn>
            <section className="bg-foreground/[0.02] border border-foreground/10 rounded-2xl p-6 md:p-8 backdrop-blur-md shadow-lg space-y-4 print:bg-white print:border-gray-300">
              <div className="flex items-center gap-3 text-accent print:text-black">
                <BookOpen className="h-6 w-6" />
                <h2 className="text-lg md:text-xl font-bold tracking-tight text-foreground print:text-black">
                  About {guideData.destination}
                </h2>
              </div>
              <p className="text-sm md:text-base text-foreground/80 leading-relaxed print:text-gray-800">
                {guideData.wikiSummary}
              </p>
            </section>
          </FadeIn>
        )}

        {/* Day Selector + Refine Panel + Map + Cards */}
        {guideData.days && guideData.days.length > 0 && (
          <FadeIn>
            <section className="space-y-8">

              {/* Day Tabs */}
              <div
                className="flex flex-wrap gap-2 justify-center border-b border-foreground/10 pb-6 print:hidden"
                role="tablist"
                aria-label="Itinerary day selector"
              >
                <button
                  role="tab"
                  aria-selected={activeDayIdx === -1}
                  onClick={() => handleDaySelect(-1)}
                  className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 cursor-pointer ${
                    activeDayIdx === -1
                      ? "bg-accent text-background shadow-lg shadow-accent/20"
                      : "bg-[#1A1714] text-foreground/75 hover:bg-[#221F1C] border border-stone-700"
                  }`}
                >
                  All Days
                </button>
                {guideData.days.map((dayData, idx) => (
                  <button
                    key={dayData.day}
                    role="tab"
                    aria-selected={activeDayIdx === idx}
                    onClick={() => handleDaySelect(idx)}
                    className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 cursor-pointer ${
                      activeDayIdx === idx
                        ? "bg-accent text-background shadow-lg shadow-accent/20"
                        : "bg-[#1A1714] text-foreground/75 hover:bg-[#221F1C] border border-stone-700"
                    }`}
                  >
                    Day {dayData.day}
                  </button>
                ))}
              </div>

              {/* ─── Refine Your Trip Chat Panel ─── */}
              <div className="bg-foreground/[0.02] border border-foreground/10 rounded-2xl p-6 backdrop-blur-md shadow-lg space-y-5 print:hidden">
                {/* Panel header with toggle */}
                <div className="flex justify-between items-center border-b border-foreground/10 pb-4">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="h-5 w-5 text-accent" />
                    <span className="font-bold text-foreground text-sm md:text-base">
                      Refine Your Trip
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsRefineOpen(!isRefineOpen)}
                    className="text-xs font-semibold px-4 py-2 rounded-full border border-foreground/20 text-foreground/70 hover:bg-foreground/5 hover:border-foreground/40 transition-all cursor-pointer select-none"
                  >
                    {isRefineOpen ? "Hide Refine Panel" : "Show Refine Panel"}
                  </button>
                </div>

                {/* Chat interface — only rendered when open */}
                {isRefineOpen && (
                  <RefineChat
                    guideData={guideData}
                    onGuideUpdated={handleGuideUpdated}
                  />
                )}
              </div>

              {/* Interactive Leaflet Map */}
              <ItineraryMap days={guideData.days} activeDayIdx={activeDayIdx} />

              {/* Day-by-Day Timeline Cards */}
              <div className="space-y-16 pt-8">
                {guideData.days.map((dayData, idx) => {
                  const isHighlighted = activeDayIdx === idx;
                  return (
                    <section
                      key={dayData.day}
                      id={`day-card-${dayData.day}`}
                      className={`p-6 md:p-8 rounded-2xl border transition-all duration-500 bg-[#1A1714]/10 ${
                        isHighlighted
                          ? "border-accent bg-[#1C1917] shadow-xl shadow-accent/5 ring-1 ring-accent"
                          : "border-foreground/10"
                      }`}
                    >
                      <h3 className="text-xl md:text-2xl font-extrabold text-foreground mb-8 flex items-center gap-3">
                        <span
                          className={`w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-sm border transition-colors ${
                            isHighlighted
                              ? "bg-accent text-background border-accent"
                              : "bg-foreground/5 text-foreground/70 border-foreground/10"
                          }`}
                        >
                          D{dayData.day}
                        </span>
                        Day {dayData.day} Details
                      </h3>

                      <div className="space-y-10 relative before:absolute before:top-2 before:bottom-2 before:left-[22px] md:before:left-[26px] before:w-0.5 before:bg-foreground/10 print:before:bg-gray-300">
                        {timesOfDay.map((time) => {
                          const detail = dayData[time.key];
                          if (!detail || !detail.activity) return null;
                          const Icon = time.icon;

                          return (
                            <div key={time.key} className="flex gap-4 md:gap-6 items-start relative group">
                              {/* Timeline icon */}
                              <div
                                className={`h-11 md:h-13 w-11 md:w-13 rounded-full flex items-center justify-center bg-[#1A1714] border-2 ${time.color} relative z-10 shrink-0 shadow-md`}
                              >
                                <Icon className="h-5 w-5 md:h-6 md:w-6" />
                              </div>

                              {/* Content card */}
                              <div className="flex-1 bg-foreground/[0.02] border border-foreground/10 rounded-2xl p-5 md:p-6 backdrop-blur-md shadow-xl transition-all duration-300 hover:border-accent/30 hover:bg-foreground/[0.03] print:bg-white print:border-gray-300 print:shadow-none">
                                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                                  <span className="text-xs md:text-sm font-extrabold text-accent/90 tracking-wide uppercase">
                                    {time.label}
                                  </span>
                                  {detail.type && (
                                    <span
                                      className={`text-[10px] md:text-xs font-semibold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${getTypeBadgeStyles(detail.type)}`}
                                    >
                                      {detail.type}
                                    </span>
                                  )}
                                </div>

                                <h4 className="text-lg md:text-xl font-bold tracking-tight text-foreground mb-2 print:text-black">
                                  {detail.activity}
                                </h4>

                                <p className="text-sm md:text-base text-foreground/80 leading-relaxed mb-4 print:text-gray-700">
                                  {detail.description}
                                </p>

                                {detail.lat !== 0 && detail.lng !== 0 && (
                                  <div className="flex items-center gap-1.5 mt-2">
                                    <a
                                      href={`https://www.google.com/maps/search/?api=1&query=${detail.lat},${detail.lng}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline cursor-pointer select-none print:text-gray-600 print:underline"
                                    >
                                      <MapPin className="h-3.5 w-3.5" />
                                      View on Map ({detail.lat.toFixed(4)}, {detail.lng.toFixed(4)})
                                    </a>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  );
                })}
              </div>

            </section>
          </FadeIn>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-4 mt-24 text-center text-xs text-foreground/40 print:text-gray-500 print:mt-16 print:pt-4 print:border-t print:border-gray-200">
        <p>Grounded in real geospatial POIs &bull; Generated by AI &bull; Verify details before your trip</p>
      </footer>
    </div>
  );
}
