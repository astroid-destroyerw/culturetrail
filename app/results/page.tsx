"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GuideResponse } from "@/types";
import { ArrowLeft } from "lucide-react";

import AttractionsSection from "@/components/AttractionsSection";
import HiddenGemsSection from "@/components/HiddenGemsSection";
import StorySection from "@/components/StorySection";
import HeritageSection from "@/components/HeritageSection";
import EventsSection from "@/components/EventsSection";
import ExperiencesSection from "@/components/ExperiencesSection";

function ResultsSkeleton() {
  return (
    <div className="min-h-screen bg-background text-foreground animate-pulse p-6">
      {/* Sticky header skeleton */}
      <div className="border-b border-foreground/10 pb-4 mb-8 flex justify-between items-center max-w-6xl mx-auto">
        <div className="h-6 w-28 bg-foreground/10 rounded"></div>
        <div className="h-8 w-40 bg-foreground/10 rounded"></div>
        <div className="h-10 w-28 bg-foreground/10 rounded-full"></div>
      </div>
      {/* Body card skeletons */}
      <div className="max-w-6xl mx-auto space-y-12 pt-6">
        <div className="space-y-4">
          <div className="h-6 w-44 bg-foreground/10 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-44 bg-foreground/5 rounded-xl border border-foreground/10"></div>
            <div className="h-44 bg-foreground/5 rounded-xl border border-foreground/10"></div>
            <div className="h-44 bg-foreground/5 rounded-xl border border-foreground/10"></div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-6 w-32 bg-foreground/10 rounded"></div>
          <div className="h-48 bg-foreground/5 rounded-xl border border-foreground/10 max-w-3xl mx-auto"></div>
        </div>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  const router = useRouter();
  const [guideData, setGuideData] = useState<GuideResponse | null>(null);
  const [isCheckingStorage, setIsCheckingStorage] = useState(true);

  useEffect(() => {
    try {
      const cached = sessionStorage.getItem("cultureGuideData");
      if (!cached) {
        router.push("/");
        return;
      }
      const parsed = JSON.parse(cached) as GuideResponse;
      if (!parsed || !parsed.destination) {
        router.push("/");
        return;
      }
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
    } catch (err) {
      console.warn("sessionStorage is not available:", err);
    }
    router.push("/");
  };

  if (isCheckingStorage || !guideData) {
    return <ResultsSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden pb-24">
      {/* Decorative gradient background glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] md:w-[600px] h-[350px] md:h-[600px] bg-accent/5 rounded-full blur-[100px] md:blur-[150px] pointer-events-none print:hidden" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[350px] md:w-[600px] h-[350px] md:h-[600px] bg-accent/5 rounded-full blur-[100px] md:blur-[150px] pointer-events-none print:hidden" />

      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-foreground/10 shadow-lg print:hidden">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          {/* Logo Branding */}
          <div className="flex items-center gap-1.5 select-none">
            <span className="text-sm md:text-base font-extrabold tracking-tight">
              Culture<span className="text-accent">Trail</span>
            </span>
          </div>

          {/* Destination Title */}
          <h1 className="text-lg md:text-2xl font-extrabold tracking-tight text-foreground truncate text-center max-w-[40%] md:max-w-[60%]">
            {guideData.destination}
          </h1>

          {/* New Search Button */}
          <button
            onClick={handleNewSearch}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs md:text-sm font-semibold rounded-full border border-accent text-accent hover:bg-accent hover:text-background transition-all duration-300 active:scale-[0.97]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            New Search
          </button>
        </div>
      </header>

      {/* Content Stack */}
      <main className="max-w-6xl mx-auto px-4 pt-12 space-y-16 md:space-y-24 relative z-10 print:pt-4">
        
        {/* Print-only Destination Title */}
        <div className="hidden print:block text-center space-y-2 mb-12">
          <h1 className="text-3xl font-extrabold text-black">
            CultureTrail &mdash; {guideData.destination}
          </h1>
          <p className="text-sm text-gray-600">Your curated AI-powered cultural guide</p>
        </div>

        {/* 1. Attractions Section */}
        {guideData.attractions && guideData.attractions.length > 0 && (
          <AttractionsSection items={guideData.attractions} />
        )}

        {/* 2. Hidden Gems Section */}
        {guideData.hiddenGems && guideData.hiddenGems.length > 0 && (
          <HiddenGemsSection items={guideData.hiddenGems} />
        )}

        {/* 3. The Story Section */}
        {guideData.story && (
          <StorySection item={guideData.story} />
        )}

        {/* 4. Heritage & Culture Section */}
        {guideData.heritage && guideData.heritage.length > 0 && (
          <HeritageSection items={guideData.heritage} />
        )}

        {/* 5. Local Events Section */}
        {guideData.localEvents && guideData.localEvents.length > 0 && (
          <EventsSection items={guideData.localEvents} />
        )}

        {/* 6. Cultural Experiences Section */}
        {guideData.culturalExperiences && guideData.culturalExperiences.length > 0 && (
          <ExperiencesSection items={guideData.culturalExperiences} />
        )}

      </main>

      {/* Muted Disclaimer */}
      <footer className="max-w-6xl mx-auto px-4 mt-16 text-center text-xs text-foreground/40 print:text-gray-500 print:mt-12 print:pt-4 print:border-t print:border-gray-200">
        <p>Generated by AI &bull; Verify details before your trip</p>
      </footer>
    </div>
  );
}
