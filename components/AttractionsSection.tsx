import { Compass } from "lucide-react";
import { Attraction } from "@/types";
import FadeIn from "./FadeIn";

interface Props {
  items: Attraction[];
}

export default function AttractionsSection({ items }: Props) {
  return (
    <FadeIn className="space-y-6">
      <div className="flex items-center gap-3 border-b border-foreground/10 pb-3">
        <Compass className="h-6 w-6 text-accent" />
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Top Attractions</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="flex flex-col bg-foreground/[0.02] border border-foreground/10 rounded-xl p-5 hover:border-accent/40 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group"
          >
            <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-accent transition-colors">
              {item.name}
            </h3>
            <p className="text-sm text-foreground/70 mb-4 flex-grow leading-relaxed">
              {item.description}
            </p>
            <div className="mt-auto pt-3 border-t border-foreground/5 space-y-1">
              <span className="text-xs font-semibold tracking-wider uppercase text-accent/80 block">
                Why Visit
              </span>
              <p className="text-xs text-foreground/80 leading-relaxed italic">
                &ldquo;{item.whyVisit}&rdquo;
              </p>
            </div>
          </div>
        ))}
      </div>
    </FadeIn>
  );
}
