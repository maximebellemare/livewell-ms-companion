import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Hand, ChevronRight, ChevronLeft, RotateCcw, Sparkles } from "lucide-react";

const SENSES = [
  {
    emoji: "👁️",
    label: "Sight",
    prompt: "Look around you. Name something beautiful or calming you can see right now.",
    placeholder: "e.g. Sunlight coming through the window, the colour of my favourite mug…",
  },
  {
    emoji: "👂",
    label: "Sound",
    prompt: "Close your eyes. What soothing sound can you hear — or play one now?",
    placeholder: "e.g. Rain outside, a song I love, the hum of the fridge…",
  },
  {
    emoji: "🤲",
    label: "Touch",
    prompt: "Find something comforting to touch. A soft blanket, warm mug, cool surface. Describe the sensation.",
    placeholder: "e.g. The softness of my hoodie sleeve, the warmth of my tea…",
  },
  {
    emoji: "👃",
    label: "Smell",
    prompt: "Is there a comforting scent nearby? A candle, lotion, fresh air, food?",
    placeholder: "e.g. Coffee brewing, lavender hand cream, fresh laundry…",
  },
  {
    emoji: "👅",
    label: "Taste",
    prompt: "Take a small sip or bite of something. Focus on the flavour for a moment.",
    placeholder: "e.g. The sweetness of chocolate, the warmth of herbal tea…",
  },
];

interface Step {
  title: string;
  instruction: string;
  type: "intro" | "sense" | "reflect" | "summary";
  senseIdx?: number;
  placeholder?: string;
}

const STEPS: Step[] = [
  {
    title: "Pause & Arrive",
    instruction: "Take three slow breaths. You're about to walk through your five senses, one at a time — finding small moments of comfort in each.",
    type: "intro",
  },
  ...SENSES.map((s, i) => ({
    title: `${s.emoji} ${s.label}`,
    instruction: s.prompt,
    type: "sense" as const,
    senseIdx: i,
    placeholder: s.placeholder,
  })),
  {
    title: "Reflect",
    instruction: "Which sense felt most soothing? What would you like to remember for next time you're distressed?",
    type: "reflect",
    placeholder: "e.g. Touch helped the most — holding my warm mug grounded me instantly…",
  },
  {
    title: "Toolkit Complete",
    instruction: "You just built a personal self-soothing kit from your own senses. Keep these tools close.",
    type: "summary",
  },
];

export function detectSelfSoothing(content: string): boolean {
  const lower = content.toLowerCase();
  return (
    /self[- ]?sooth(e|ing)/i.test(lower) ||
    /soothing\s*toolkit/i.test(lower) ||
    (lower.includes("sensory") && (lower.includes("coping") || lower.includes("comfort") || lower.includes("soothing"))) ||
    (lower.includes("five senses") && (lower.includes("exercise") || lower.includes("coping") || lower.includes("calm")))
  );
}

const SelfSoothingToolkitWidget = () => {
  const [stepIdx, setStepIdx] = useState(0);
  const [answers, setAnswers] = useState<string[]>(STEPS.map(() => ""));
  const [done, setDone] = useState(false);

  const current = STEPS[stepIdx];

  const canAdvance =
    current.type === "intro" || current.type === "summary"
      ? true
      : answers[stepIdx]?.trim().length > 0;

  const haptic = useCallback(() => {
    if (navigator.vibrate) navigator.vibrate(10);
  }, []);

  const updateAnswer = (value: string) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[stepIdx] = value;
      return next;
    });
  };

  const next = () => {
    haptic();
    if (stepIdx + 1 >= STEPS.length) setDone(true);
    else setStepIdx((i) => i + 1);
  };

  const prev = () => {
    haptic();
    if (stepIdx > 0) setStepIdx((i) => i - 1);
  };

  const reset = () => {
    setStepIdx(0);
    setAnswers(STEPS.map(() => ""));
    setDone(false);
  };

  // Gather filled sense answers for summary
  const filledSenses = SENSES.map((s, i) => ({
    ...s,
    answer: answers[i + 1]?.trim() || "",
  })).filter((s) => s.answer);

  return (
    <div className="mt-3 rounded-2xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-secondary/30">
        <Hand className="h-4 w-4 text-primary" />
        <span className="text-xs font-semibold text-foreground">Self-Soothing Toolkit</span>
        <span className="ml-auto text-[10px] text-muted-foreground">
          {done ? "Complete" : `${stepIdx + 1} / ${STEPS.length}`}
        </span>
      </div>

      <div className="px-4 py-4">
        <AnimatePresence mode="wait">
          {!done && (
            <motion.div
              key={stepIdx}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-3"
            >
              <p className="text-[10px] font-semibold uppercase tracking-widest text-primary">
                {current.title}
              </p>
              <p className="text-xs text-foreground leading-relaxed">{current.instruction}</p>

              {(current.type === "sense" || current.type === "reflect") && (
                <textarea
                  value={answers[stepIdx]}
                  onChange={(e) => updateAnswer(e.target.value)}
                  placeholder={current.placeholder}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              )}

              {current.type === "summary" && (
                <div className="rounded-xl bg-primary/5 border border-primary/10 px-4 py-3 space-y-2.5">
                  {filledSenses.map((s) => (
                    <div key={s.label}>
                      <p className="text-[10px] font-semibold text-muted-foreground mb-0.5">
                        {s.emoji} {s.label}
                      </p>
                      <p className="text-xs text-foreground leading-relaxed">{s.answer}</p>
                    </div>
                  ))}
                  {answers[STEPS.length - 2]?.trim() && (
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground mb-0.5">💡 Takeaway</p>
                      <p className="text-xs text-foreground leading-relaxed italic">"{answers[STEPS.length - 2]}"</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {done && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-3"
            >
              <div className="mx-auto h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm font-medium text-foreground">Senses explored 🌿</p>
              <div className="rounded-xl bg-primary/5 border border-primary/10 px-4 py-3 text-left">
                <div className="flex flex-wrap gap-1.5">
                  {filledSenses.map((s) => (
                    <span key={s.label} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
                      {s.emoji} {s.label}
                    </span>
                  ))}
                </div>
                {answers[STEPS.length - 2]?.trim() && (
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed italic">
                    "{answers[STEPS.length - 2].slice(0, 100)}{answers[STEPS.length - 2].length > 100 ? "…" : ""}"
                  </p>
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
                Your senses are always available to you. When distress rises, return to whichever sense felt most grounding.
              </p>
              <button
                onClick={reset}
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[11px] text-muted-foreground hover:bg-secondary transition-colors"
              >
                <RotateCcw className="h-3 w-3" /> Repeat
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {!done && (
          <div className="flex justify-center gap-1.5 pt-3">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 w-1.5 rounded-full transition-colors ${
                  i < stepIdx ? "bg-primary" : i === stepIdx ? "bg-primary/60" : "bg-muted"
                }`}
              />
            ))}
          </div>
        )}

        {!done && (
          <div className="flex items-center justify-center gap-2 pt-3">
            {stepIdx > 0 && (
              <button
                onClick={prev}
                className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-[11px] text-muted-foreground hover:bg-secondary transition-colors"
              >
                <ChevronLeft className="h-3 w-3" /> Back
              </button>
            )}
            {canAdvance && (
              <button
                onClick={next}
                className="flex items-center gap-1 rounded-full bg-primary px-4 py-1.5 text-[11px] font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                {stepIdx === 0 ? "Begin" : stepIdx + 1 >= STEPS.length ? "Finish" : "Next"}
                <ChevronRight className="h-3 w-3" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SelfSoothingToolkitWidget;
