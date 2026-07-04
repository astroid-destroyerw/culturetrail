import { Landmark } from "lucide-react";
import { HeritageItem } from "@/types";
import FadeIn from "./FadeIn";

interface Props {
  items: HeritageItem[];
}

export default function HeritageSection({ items }: Props) {
  return (
    <FadeIn className="space-y-6">
      <div className="flex items-center gap-3 border-b border-foreground/10 pb-3">
        <Landmark className="h-6 w-6 text-accent" />
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Heritage & Culture</h2>
      </div>

      <div className="space-y-4 max-w-3xl mx-auto">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="flex gap-4 p-5 bg-foreground/[0.01] border border-foreground/5 rounded-xl hover:border-foreground/10 transition-all duration-300"
          >
            <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-accent/10 text-accent font-bold text-sm">
              {idx + 1}
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-foreground">
                {item.title}
              </h3>
              <p className="text-sm text-foreground/75 leading-relaxed">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </FadeIn>
  );
}
