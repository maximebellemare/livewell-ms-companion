import { useState } from "react";
import { Trophy, Check } from "lucide-react";

interface Props {
  onSubmit: (win: string) => void;
}

const SmallWinField = ({ onSubmit }: Props) => {
  const [value, setValue] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showInput, setShowInput] = useState(false);

  const handleSubmit = () => {
    if (!value.trim()) return;
    onSubmit(value.trim());
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="rounded-xl border border-amber-200/60 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-950/20 p-3 space-y-2">
      <div className="flex items-center gap-1.5">
        <Trophy className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
        <span className="text-xs font-semibold text-foreground">One small win today</span>
      </div>
      <p className="text-[10px] text-muted-foreground leading-relaxed">
        What's one thing you managed, no matter how small?
      </p>
      {!showInput ? (
        <button
          onClick={() => setShowInput(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 px-3 py-1.5 text-xs font-semibold text-primary transition-all active:scale-95"
        >
          <Trophy className="h-3 w-3" />
          Add a win
        </button>
      ) : (
        <div className="space-y-2 animate-fade-in">
          <textarea
            value={value}
            onChange={(e) => { setValue(e.target.value); setSubmitted(false); }}
            placeholder="e.g. I took a short walk…"
            maxLength={200}
            rows={2}
            autoFocus
            className="w-full resize-none rounded-lg bg-background border border-border px-2.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
          />
          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={() => { setShowInput(false); setValue(""); }}
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                handleSubmit();
                setShowInput(false);
              }}
              disabled={!value.trim() || submitted}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                submitted
                  ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400"
                  : "bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40"
              }`}
            >
              {submitted ? <Check className="h-3 w-3" /> : "Save win"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmallWinField;
