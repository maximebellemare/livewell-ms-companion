import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, ChevronRight, Pause, Play, RotateCcw } from "lucide-react";

const STEPS = [
  {
    title: "Screen Dimming",
    instruction: "Put your phone on its lowest brightness. If you can, switch to night mode or grayscale.",
    phrase: "Let your eyes begin to rest.",
    duration: 15,
  },
  {
    title: "Body Check-In",
    instruction: "Sitting or lying down, scan from head to toes. Where are you holding tension?",
    phrase: "Notice without judgement. Just observe.",
    duration: 18,
  },
  {
    title: "Slow Breathing",
    instruction: "Inhale gently for 4 counts. Exhale slowly for 6 counts. Repeat 4 times.",
    phrase: "Each exhale invites your body to soften.",
    duration: 20,
  },
  {
    title: "Gratitude Moment",
    instruction: "Think of one small thing from today you're grateful for — no matter how ordinary.",
    phrase: "Even tough days hold something worth noticing.",
    duration: 18,
  },
  {
    title: "Letting Go",
    instruction: "Picture placing tomorrow's worries into a box and setting it aside until morning.",
    phrase: "You've done enough for today.",
    duration: 18,
  },
  {
    title: "Comfort Settling",
    instruction: "Adjust your pillow or blanket. Find the position where your body feels most supported.",
    phrase: "You deserve a restful night.",
    duration: 15,
  },
  {
    title: "Sleep Intention",
    instruction: "Silently repeat: 'I give myself permission to rest.' Let the words sink in.",
    phrase: "Rest is not a reward — it's a necessity.",
    duration: 18,
  },
];

export const detectSleepWindDown = (content: string): boolean => {
  const lower = content.toLowerCase();
  return (
    /sleep\s*wind[- ]?down/i.test(lower) ||
    /wind[- ]?down\s*(routine|exercise|practice|sequence)/i.test(lower) ||
    /bedtime\s*(routine|sequence|exercise|practice|ritual)/i.test(lower) ||
    /pre[- ]?bed(time)?\s*(routine|sequence|calm)/i.test(lower) ||
    (lower.includes("wind down") && (lower.includes("sleep") || lower.includes("bed") || lower.includes("night"))) ||
    (lower.includes("sleep") && lower.includes("routine") && (lower.includes("calm") || lower.includes("relax") || lower.includes("gentle")))
  );
};

const SleepWindDownWidget = () => {
  const [state, setState] = useState<"idle" | "active" | "complete">("idle");
  const [step, setStep] = useState(0);
  const [timer, setTimer] = useState(0);
  const [paused, setPaused] = useState(false);

  const current = STEPS[step];

  useEffect(() => {
    if (state !== "active" || paused) return;
    if (timer >= current.duration) {
      if (step < STEPS.length - 1) {
        setStep((s) => s + 1);
        setTimer(0);
      } else {
        setState("complete");
      }
      return;
    }
    const id = setInterval(() => setTimer((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [state, paused, timer, step, current.duration]);

  const start = () => {
    setState("active");
    setStep(0);
    setTimer(0);
    setPaused(false);
  };

  const skip = useCallback(() => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
      setTimer(0);
    } else {
      setState("complete");
    }
  }, [step]);

  const progress = current ? timer / current.duration : 1;

  return (
    <div className="mt-3 rounded-2xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-secondary/30">
        <Moon className="h-4 w-4 text-primary" />
        <span className="text-xs font-semibold text-foreground">Sleep Wind-Down</span>
        <span className="ml-auto text-[10px] text-muted-foreground">
          {state === "active" ? `${step + 1} / ${STEPS.length}` : state === "complete" ? "Complete" : `${STEPS.length} steps`}
        </span>
      </div>

      <div className="px-4 py-4">
        <AnimatePresence mode="wait">
          {state === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center space-y-3"
            >
              <p className="text-xs text-muted-foreground leading-relaxed">
                A calming {STEPS.length}-step bedtime sequence to help your mind and body prepare for sleep.
              </p>
              <button
                onClick={start}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Moon className="h-3.5 w-3.5" /> Begin Wind-Down
              </button>
            </motion.div>
          )}

          {state === "active" && current && (
            <motion.div
              key={`step-${step}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="space-y-3"
            >
              <p className="text-[10px] font-semibold uppercase tracking-widest text-primary">
                {current.title}
              </p>
              <p className="text-xs text-foreground leading-relaxed">{current.instruction}</p>
              <div className="rounded-xl bg-primary/5 border border-primary/10 px-4 py-3 text-center">
                <p className="text-sm font-medium text-foreground italic leading-relaxed">
                  "{current.phrase}"
                </p>
              </div>

              <div className="h-1 w-full rounded-full bg-secondary overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              <div className="flex items-center justify-center gap-3 pt-1">
                <button
                  onClick={() => setPaused((p) => !p)}
                  className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-[11px] text-muted-foreground hover:bg-secondary transition-colors"
                >
                  {paused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                  {paused ? "Resume" : "Pause"}
                </button>
                <button
                  onClick={skip}
                  className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-[11px] text-muted-foreground hover:bg-secondary transition-colors"
                >
                  <ChevronRight className="h-3 w-3" /> Skip
                </button>
              </div>

              <div className="flex justify-center gap-1.5 pt-1">
                {STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 w-1.5 rounded-full transition-colors ${
                      i < step ? "bg-primary" : i === step ? "bg-primary/60" : "bg-muted"
                    }`}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {state === "complete" && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-3"
            >
              <div className="mx-auto h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Moon className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm font-medium text-foreground">Ready for rest</p>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
                You've prepared your mind and body for sleep. Sweet dreams — tomorrow is a fresh start.
              </p>
              <button
                onClick={start}
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[11px] text-muted-foreground hover:bg-secondary transition-colors"
              >
                <RotateCcw className="h-3 w-3" /> Repeat
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SleepWindDownWidget;
