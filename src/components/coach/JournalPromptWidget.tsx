import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Feather, Sparkles, ChevronRight, ChevronLeft, RotateCcw, Check } from "lucide-react";

const JOURNAL_STEPS = [
  {
    id: "prompt",
    title: "Reflect",
    instruction: "Take a moment to sit with today's prompt",
    icon: BookOpen,
  },
  {
    id: "freewrite",
    title: "Write",
    instruction: "Write freely — no filter, no judgement",
    placeholder: "Let your thoughts flow…",
    icon: Feather,
  },
  {
    id: "insight",
    title: "Insight",
    instruction: "What's one thing you noticed while writing?",
    placeholder: "e.g. I realised I've been ignoring…",
    icon: Sparkles,
  },
  {
    id: "intention",
    title: "Intention",
    instruction: "Set a small, gentle intention based on your reflection",
    placeholder: "e.g. Tomorrow I'll give myself permission to rest…",
    icon: Check,
  },
];

const REFLECTIVE_PROMPTS = [
  "What emotion kept showing up for you today?",
  "What part of your day felt most like 'you'?",
  "What would you say to a friend going through your day?",
  "Where in your body do you hold today's feelings?",
  "What's something you needed today but didn't get?",
  "What small victory are you overlooking?",
  "What would it look like to be gentler with yourself right now?",
  "What are you carrying that isn't yours to carry?",
];

function getSessionPrompt(): string {
  const idx = Math.floor(Math.random() * REFLECTIVE_PROMPTS.length);
  return REFLECTIVE_PROMPTS[idx];
}

const JournalPromptWidget = () => {
  const [stepIdx, setStepIdx] = useState(0);
  const [answers, setAnswers] = useState<string[]>(JOURNAL_STEPS.map(() => ""));
  const [done, setDone] = useState(false);
  const [prompt] = useState(getSessionPrompt);

  const progress = done ? 1 : stepIdx / JOURNAL_STEPS.length;
  const currentStep = JOURNAL_STEPS[stepIdx];

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

  // Step 0 (prompt display) can always advance; others need text
  const canAdvance = stepIdx === 0 || answers[stepIdx]?.trim().length > 0;

  const nextStep = () => {
    haptic();
    if (stepIdx + 1 >= JOURNAL_STEPS.length) {
      setDone(true);
    } else {
      setStepIdx((i) => i + 1);
    }
  };

  const prevStep = () => {
    haptic();
    if (stepIdx > 0) setStepIdx((i) => i - 1);
  };

  const reset = () => {
    setStepIdx(0);
    setAnswers(JOURNAL_STEPS.map(() => ""));
    setDone(false);
  };

  const CIRCLE_R = 46;
  const CIRCUMFERENCE = 2 * Math.PI * CIRCLE_R;
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  return (
    <div className="flex flex-col items-center gap-3 py-4">
      {/* Progress ring */}
      <div className="relative flex items-center justify-center" style={{ width: 120, height: 120 }}>
        <svg width={120} height={120} className="absolute -rotate-90">
          <circle cx={60} cy={60} r={CIRCLE_R} fill="none" stroke="hsl(var(--muted))" strokeWidth={5} />
          <circle
            cx={60} cy={60} r={CIRCLE_R}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth={5}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            style={{ transition: "stroke-dashoffset 0.4s ease" }}
          />
        </svg>
        <AnimatePresence mode="wait">
          <motion.div
            key={done ? "done" : stepIdx}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="absolute flex flex-col items-center"
          >
            {done ? (
              <>
                <Sparkles className="h-6 w-6 text-primary" />
                <span className="text-xs font-semibold text-foreground mt-1">Complete</span>
              </>
            ) : (
              <>
                <currentStep.icon className="h-6 w-6 text-primary" />
                <span className="text-xs font-semibold text-foreground mt-1">{currentStep.title}</span>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Active step content */}
      {!done && (
        <AnimatePresence mode="wait">
          <motion.div
            key={stepIdx}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center gap-2 w-full max-w-[280px]"
          >
            <p className="text-sm font-medium text-foreground text-center">{currentStep.instruction}</p>

            {stepIdx === 0 ? (
              /* Prompt display step */
              <div className="w-full rounded-xl bg-secondary/50 border border-border px-4 py-3">
                <p className="text-sm text-foreground text-center italic leading-relaxed">"{prompt}"</p>
              </div>
            ) : (
              /* Writing steps */
              <textarea
                value={answers[stepIdx]}
                onChange={(e) => updateAnswer(e.target.value)}
                placeholder={currentStep.placeholder}
                rows={3}
                className="w-full resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Completion summary */}
      {done && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[280px] space-y-2"
        >
          <div className="rounded-xl bg-secondary/50 border border-border p-3 space-y-2.5">
            <div className="flex items-start gap-2">
              <BookOpen className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-[11px] text-muted-foreground italic leading-relaxed">"{prompt}"</p>
            </div>
            <div className="flex items-start gap-2">
              <Feather className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-xs text-foreground leading-relaxed line-clamp-3">{answers[1]}</p>
            </div>
            <div className="flex items-start gap-2">
              <Sparkles className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-foreground leading-relaxed">{answers[2]}</p>
            </div>
            <div className="flex items-start gap-2">
              <Check className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-foreground leading-relaxed font-medium">{answers[3]}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Step dots */}
      <div className="flex items-center gap-1.5">
        {JOURNAL_STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i < stepIdx || done
                ? "w-4 bg-primary"
                : i === stepIdx
                ? "w-4 bg-primary/50"
                : "w-1.5 bg-muted-foreground/30"
            }`}
          />
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground">
        {done ? "Reflection complete" : `Step ${stepIdx + 1} of ${JOURNAL_STEPS.length}`}
      </p>

      {/* Controls */}
      <div className="flex items-center gap-2">
        {!done && stepIdx > 0 && (
          <button
            onClick={prevStep}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:text-foreground active:scale-95 transition-all"
            aria-label="Previous step"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
        {!done && canAdvance && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={nextStep}
            className="flex h-9 items-center gap-1.5 px-4 rounded-full bg-primary text-primary-foreground text-sm font-medium active:scale-95 transition-transform"
          >
            {stepIdx === 0 ? "Begin" : stepIdx + 1 >= JOURNAL_STEPS.length ? "Finish" : "Next"}
            <ChevronRight className="h-4 w-4" />
          </motion.button>
        )}
        {done && (
          <button
            onClick={reset}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:text-foreground active:scale-95 transition-all"
            aria-label="Reset"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Detects if a message contains a guided journaling/reflective writing exercise.
 */
export function detectJournalingExercise(content: string): boolean {
  const lower = content.toLowerCase();
  return (
    (lower.includes("journal") || lower.includes("reflective writing") || lower.includes("reflection exercise")) &&
    (lower.includes("prompt") || lower.includes("guided") || lower.includes("step") || lower.includes("write"))
  ) || (
    lower.includes("let's begin") && lower.includes("reflect") && lower.includes("write")
  );
}

export default JournalPromptWidget;
