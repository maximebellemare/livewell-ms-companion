import { useState } from "react";
import { PenLine, RefreshCw } from "lucide-react";
import { PROMPTS, getDailyPrompt } from "@/lib/dailyPrompts";

interface DailyPromptCardProps {
  onUsePrompt: (prompt: string) => void;
}

const DailyPromptCard = ({ onUsePrompt }: DailyPromptCardProps) => {
  const daily = getDailyPrompt();
  const [currentIndex, setCurrentIndex] = useState(daily.index);
  const [animating, setAnimating] = useState(false);

  const currentPrompt = PROMPTS[currentIndex];

  const shuffle = () => {
    setAnimating(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % PROMPTS.length);
      setAnimating(false);
    }, 180);
  };

  return (
    <div className="rounded-xl border border-primary/15 bg-primary/5 p-4 space-y-3 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-base">💭</span>
          <span className="text-xs font-semibold text-foreground">Today's prompt</span>
        </div>
        <button
          onClick={shuffle}
          disabled={animating}
          className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          title="Try another prompt"
        >
          <RefreshCw className={`h-2.5 w-2.5 ${animating ? "animate-spin" : ""}`} />
          Another
        </button>
      </div>

      {/* Prompt text */}
      <p
        className={`text-sm font-medium text-foreground leading-relaxed transition-opacity duration-150 ${
          animating ? "opacity-0" : "opacity-100"
        }`}
      >
        {currentPrompt}
      </p>

      {/* CTA */}
      <span className="relative inline-flex">
        <span className="absolute inset-0 rounded-lg bg-primary/20 pulse" />
        <button
          onClick={() => onUsePrompt(currentPrompt)}
          className="relative inline-flex items-center gap-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 px-3 py-1.5 text-xs font-semibold text-primary transition-all active:scale-95"
        >
          <PenLine className="h-3 w-3" />
          Reflect on this
        </button>
      </span>
    </div>
  );
};

export default DailyPromptCard;
