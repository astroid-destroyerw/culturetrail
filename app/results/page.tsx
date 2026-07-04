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
    <div className="w-full h-[400px] md:h-[450px] rounded-2xl bg-surface-1 border border-[var(--border)] flex items-center justify-center animate-pulse print:hidden">
      <span className="text-sm text-foreground/40">Loading map…</span>
    </div>
  ),
});

function ResultsSkeleton() {
  return (
    <div className="min-h-screen bg-background text-foreground animate-pulse p-6">
      <div className="border-b border-[var(--border)] pb-4 mb-8 flex justify-between items-center max-w-6xl mx-auto">
        <div className="h-5 w-24 bg-foreground/8 rounded-lg" />
        <div className="h-6 w-40 bg-foreground/8 rounded-lg" />
        <div className="h-9 w-24 bg-foreground/8 rounded-xl" />
      </div>
      <div className="max-w-4xl mx-auto space-y-10 pt-6">
        <div className="h-28 bg-surface-1 rounded-2xl border border-[var(--border)]" />
        <div className="flex gap-2 justify-center">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-9 w-20 bg-foreground/8 rounded-xl" />
          ))}
        </div>
        <div className="h-[400px] bg-surface-1 rounded-2xl border border-[var(--border)]" />
      </div>
    </div>
  );
}

export default function ResultsPage() {
  const router = useRouter();
  const [guideData, setGuideData] = useState<GuideResponse | null>(null);
  const [isCheckingStorage, setIsCheckingStorage] = useState(true);
  const [activeDayIdx, setActiveDayIdx] = useState(-1);
  const [isRefineOpen, setIsRefineOpen] = useState(true);

  useEffect(() => {
    try {
      const cached = sessionStorage.getItem("cultureGuideData");
      if (!cached) { router.push("/"); return; }
      const parsed = JSON.parse(cached) as GuideResponse;
      if (!parsed?.destination) { router.push("/"); return; }
      setGuideData(parsed);
    } catch { router.push("/"); }
    finally { setIsCheckingStorage(false); }
  }, [router]);

  useEffect(() => {
    if (guideData) document.title = `CultureTrail — ${guideData.destination}`;
  }, [guideData]);

  const handleNewSearch = () => {
    try {
      sessionStorage.removeItem("cultureGuideData");
      sessionStorage.removeItem("cultureGuideParams");
    } catch { /* ignore */ }
    router.push("/");
  };

  const handleDaySelect = (idx: number) => {
    setActiveDayIdx(idx);
    if (idx >= 0) {
      document.getElementById(`day-card-${idx + 1}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleGuideUpdated = (newGuide: GuideResponse) => {
    setGuideData(newGuide);
    setActiveDayIdx(-1);
  };

  if (isCheckingStorage || !guideData) return <ResultsSkeleton />;

  const timesOfDay = [
    { key: "morning"   as const, label: "Morning",   icon: Sun,     iconColor: "text-amber-400" },
    { key: "afternoon" as const, label: "Afternoon",  icon: Compass, iconColor: "text-accent"    },
    { key: "evening"   as const, label: "Evening",    icon: Moon,    iconColor: "text-indigo-400" },
  ];

  const getTypeBadge = (type: string) => {
    switch (type.toLowerCase()) {
      case "museum":      return "text-emerald-400/90 bg-emerald-500/8";
      case "historic":    return "text-amber-400/90 bg-amber-500/8";
      case "viewpoint":   return "text-blue-400/90 bg-blue-500/8";
      case "marketplace": return "text-pink-400/90 bg-pink-500/8";
      case "religion":    return "text-purple-400/90 bg-purple-500/8";
      case "artwork":     return "text-teal-400/90 bg-teal-500/8";
      default:            return "text-foreground/50 bg-foreground/5";
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden pb-24">
      {/* Ambient glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[160px] pointer-events-none print:hidden" />
      <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-accent/4 rounded-full blur-[140px] pointer-events-none print:hidden" />

      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-background/85 backdrop-blur-xl border-b border-[var(--border)] print:hidden">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between gap-4">
          <span className="text-sm font-bold tracking-tight select-none shrink-0">
            Culture<span className="text-accent">Trail</span>
          </span>

          <h1 className="text-base md:text-xl font-semibold text-foreground truncate text-center max-w-[40%] md:max-w-[55%]">
            {guideData.destination}
          </h1>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleNewSearch}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs md:text-sm font-medium rounded-xl border border-[var(--border)] text-foreground/70 hover:text-foreground hover:bg-surface-2 hover:border-[var(--border-hover)] transition-all duration-200 active:scale-[0.97]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              New Search
            </button>

            <a
              href="/api/auth/logout"
              className="text-xs font-medium px-3.5 py-2 rounded-xl text-foreground/45 hover:text-foreground/70 hover:bg-surface-1 transition-all select-none"
            >
              Log out
            </a>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 pt-12 space-y-14 relative z-10 print:pt-4">
        {/* Print title */}
        <div className="hidden print:block text-center space-y-1.5 mb-12">
          <h1 className="text-3xl font-bold text-black">CultureTrail — {guideData.destination}</h1>
          <p className="text-sm text-gray-500">Your curated AI-powered cultural guide</p>
        </div>

        {/* Wikipedia summary */}
        {guideData.wikiSummary && (
          <FadeIn>
            <section className="bg-surface-1 rounded-2xl p-6 md:p-8 shadow-card border border-[var(--border)] space-y-3 print:bg-white print:border-gray-300">
              <div className="flex items-center gap-2.5 text-accent">
                <BookOpen className="h-5 w-5" />
                <h2 className="text-base md:text-lg font-semibold text-foreground">
                  About {guideData.destination}
                </h2>
              </div>
              <p className="text-sm md:text-base text-foreground/70 leading-loose print:text-gray-700">
                {guideData.wikiSummary}
              </p>
            </section>
          </FadeIn>
        )}

        {guideData.days?.length > 0 && (
          <FadeIn>
            <section className="space-y-8">
              {/* Day tabs */}
              <div
                className="flex flex-wrap gap-2 justify-center pb-6 border-b border-[var(--border)] print:hidden"
                role="tablist"
                aria-label="Itinerary day selector"
              >
                {[{ label: "All Days", idx: -1 }, ...guideData.days.map((d, i) => ({ label: `Day ${d.day}`, idx: i }))].map(({ label, idx }) => (
                  <button
                    key={label}
                    role="tab"
                    aria-selected={activeDayIdx === idx}
                    onClick={() => handleDaySelect(idx)}
                    className={`px-5 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                      activeDayIdx === idx
                        ? "bg-accent text-background shadow-accent shadow-sm"
                        : "bg-surface-1 text-foreground/60 hover:text-foreground/90 hover:bg-surface-2 border border-[var(--border)]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Refine Your Trip — Chat Panel */}
              <div className="bg-surface-1 rounded-2xl border border-[var(--border)] shadow-card overflow-hidden print:hidden">
                {/* Panel header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-[var(--border)]">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4 text-accent/80" />
                    <span className="text-sm font-semibold text-foreground/90">Refine Your Trip</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsRefineOpen(!isRefineOpen)}
                    className="text-xs font-medium px-3.5 py-1.5 rounded-lg text-foreground/50 hover:text-foreground/80 hover:bg-surface-2 transition-all cursor-pointer select-none"
                  >
                    {isRefineOpen ? "Hide" : "Show Refine Panel"}
                  </button>
                </div>

                {isRefineOpen && (
                  <div className="p-6">
                    <RefineChat guideData={guideData} onGuideUpdated={handleGuideUpdated} />
                  </div>
                )}
              </div>

              {/* Interactive map */}
              <div className="rounded-2xl overflow-hidden border border-[var(--border)] shadow-card print:hidden">
                <ItineraryMap days={guideData.days} activeDayIdx={activeDayIdx} />
              </div>

              {/* Day-by-day timeline */}
              <div className="space-y-14 pt-4">
                {guideData.days.map((dayData, idx) => {
                  const isHighlighted = activeDayIdx === idx;
                  return (
                    <section
                      key={dayData.day}
                      id={`day-card-${dayData.day}`}
                      className={`rounded-2xl border transition-all duration-500 ${
                        isHighlighted
                          ? "bg-surface-1 border-accent/25 shadow-card-hover ring-1 ring-accent/20"
                          : "bg-surface-1/50 border-[var(--border)]"
                      } p-6 md:p-8`}
                    >
                      <h3 className="text-lg md:text-xl font-semibold text-foreground mb-8 flex items-center gap-3">
                        <span
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${
                            isHighlighted
                              ? "bg-accent text-background"
                              : "bg-surface-3 text-foreground/60"
                          }`}
                        >
                          D{dayData.day}
                        </span>
                        Day {dayData.day}
                      </h3>

                      {/* Timeline */}
                      <div className="space-y-8 relative before:absolute before:top-3 before:bottom-3 before:left-[15px] md:before:left-[15px] before:w-px before:bg-foreground/8">
                        {timesOfDay.map((time) => {
                          const detail = dayData[time.key];
                          if (!detail?.activity) return null;
                          const Icon = time.icon;

                          return (
                            <div key={time.key} className="flex gap-5 items-start relative group">
                              {/* Timeline dot */}
                              <div className={`w-[30px] h-[30px] rounded-lg flex items-center justify-center bg-surface-2 border border-[var(--border)] relative z-10 shrink-0 shadow-sm ${time.iconColor}`}>
                                <Icon className="h-3.5 w-3.5" />
                              </div>

                              {/* Card */}
                              <div className="flex-1 bg-surface-2 rounded-2xl p-5 border border-[var(--border)] shadow-sm transition-all duration-300 hover:border-[var(--border-hover)] hover:shadow-card print:bg-white print:border-gray-300">
                                <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                                  <span className="text-xs font-semibold text-accent/80 tracking-wide uppercase">
                                    {time.label}
                                  </span>
                                  {detail.type && (
                                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md uppercase tracking-wide ${getTypeBadge(detail.type)}`}>
                                      {detail.type}
                                    </span>
                                  )}
                                </div>

                                <h4 className="text-base md:text-lg font-semibold text-foreground mb-1.5 print:text-black">
                                  {detail.activity}
                                </h4>

                                <p className="text-sm text-foreground/65 leading-relaxed mb-3 print:text-gray-600">
                                  {detail.description}
                                </p>

                                {detail.lat !== 0 && detail.lng !== 0 && (
                                  <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${detail.lat},${detail.lng}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-accent/70 hover:text-accent transition-colors"
                                  >
                                    <MapPin className="h-3 w-3" />
                                    View on Map
                                  </a>
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

      <footer className="max-w-6xl mx-auto px-4 mt-24 text-center text-xs text-foreground/30 print:text-gray-500 print:mt-12 print:pt-4 print:border-t print:border-gray-200">
        Grounded in real geospatial POIs &bull; Generated by AI &bull; Verify details before your trip
      </footer>
    </div>
  );
}
