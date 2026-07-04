import { BookOpen } from "lucide-react";
import { Story } from "@/types";
import FadeIn from "./FadeIn";

interface Props {
  item: Story;
}

export default function StorySection({ item }: Props) {
  return (
    <FadeIn className="space-y-6">
      <div className="flex items-center gap-3 border-b border-foreground/10 pb-3">
        <BookOpen className="h-6 w-6 text-accent" />
        <h2 className="text-2xl font-bold tracking-tight text-foreground">The Story</h2>
      </div>

      <div className="bg-foreground/[0.02] border-l-4 border-l-accent border-y border-r border-y-foreground/10 border-r-foreground/10 rounded-r-2xl p-6 md:p-8 backdrop-blur-sm shadow-xl max-w-3xl mx-auto">
        <h3 className="text-xl md:text-2xl font-bold text-foreground mb-4 tracking-tight">
          {item.title}
        </h3>
        <p className="text-sm md:text-base text-foreground/80 leading-relaxed font-sans max-w-prose whitespace-pre-line italic">
          &ldquo;{item.narrative}&rdquo;
        </p>
      </div>
    </FadeIn>
  );
}
