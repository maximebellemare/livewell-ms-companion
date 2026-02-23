import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ChevronRight, Pause, Play, RotateCcw } from "lucide-react";

const PHASES = [
  {
    title: "Acknowledge",
    instruction: "Place your hand on your heart. Take a slow breath.",
    phrase: "This is a moment of suffering.",
    subtext: "Recognising pain is the first step toward compassion.",
    duration: 12,
  },
  {
    title: "Common Humanity",
    instruction: "Remember: you are not alone in this.",
    phrase: "Suffering is a part of being human.",
    subtext: "Others with MS share similar struggles — you are connected.",
    duration: 14,
  },
  {
    title: "Loving-Kindness",
    instruction: "Silently repeat this phrase to yourself:",
    phrase: "May I be kind to myself in this moment.",
    subtext: "Let the words land gently, without forcing anything.",
    duration: 14,
  },
  {
    title: "Strength",
    instruction: "Breathe in strength, breathe out tension.",
    phrase: "May I give myself the compassion I need.",
    subtext: "You deserve the same care you'd offer a friend.",
    duration: 14,
  },
  {
    title: "Peace",
    instruction: "Let your shoulders soften. Relax your jaw.",
    phrase: "May I find peace with what I cannot control.",
    subtext: "Living with uncertainty takes extraordinary courage.",
    duration: 14,
  },
  {
    title: "Gratitude",
    instruction: "Notice one thing your body did for you today.",
    phrase: "May I honour my body, even on hard days.",
    subtext: "Your body carries you through so much — it deserves thanks.",
    duration: 12,
  },
];

export const detectSelfCompassion = (content: string): boolean => {
  const lower = content.toLowerCase();
  return (
    /self[- ]compassion\s*(break|exercise|practice|moment)/i.test(lower) ||
    /loving[- ]kindness/i.test(lower) ||
    (lower.includes("self-compassion") && (lower.includes("guide") || lower.includes("through") || lower.includes("try") || lower.includes("let's") || lower.includes("here"))) ||
    (lower.includes("compassion") && lower.includes("break"))
  );
};

const SelfCompassionWidget = () => {
  const [state, setState] = useState<"idle" | "active" | "complete">("idle");
  const [phase, setPhase] = useState(0);
  const [timer, setTimer] = useState(0);
  const [paused, setPaused] = useState(false);

  const current = PHASES[phase];

  useEffect(() => {
    if (state !== "active" || paused) return;
    if (timer >= current.duration) {
      if (phase < PHASES.length - 1) {
        setPhase((p) => p + 1);
        setTimer(0);
      } else {
        setState("complete");
      }
      return;
    }
    const id = setInterval(() => setTimer((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [state, paused, timer, phase, current.duration]);

  const start = () => {
    setState("active");
    setPhase(0);
    setTimer(0);
    setPaused(false);
  };

  const restart = () => start();

  const skip = useCallback(() => {
    if (phase < PHASES.length - 1) {
      setPhase((p) => p + 1);
      setTimer(0);
    } else {
      setState("complete");
    }
  }, [phase]);

  const progress = current ? timer / current.duration : 1;

  return (
    <div className="mt-3 rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-secondary/30">
        <Heart className="h-4 w-4 text-primary" />
        <span className="text-xs font-semibold text-foreground">Self-Compassion Break</span>
        <span className="ml-auto text-[10px] text-muted-foreground">
          {state === "active" ? `${phase + 1} / ${PHASES.length}` : state === "complete" ? "Complete" : `${PHASES.length} phases`}
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
                A gentle {PHASES.length}-step practice to cultivate kindness toward yourself, especially on tough days.
              </p>
              <button
                onClick={start}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Heart className="h-3.5 w-3.5" /> Begin Practice
              </button>
            </motion.div>
          )}

          {state === "active" && current && (
            <motion.div
              key={`phase-${phase}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="space-y-3"
            >
              <p className="text-[10px] font-semibold uppercase tracking-widest text-primary">
                {current.title}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {current.instruction}
              </p>
              <div className="rounded-xl bg-primary/5 border border-primary/10 px-4 py-3 text-center">
                <p className="text-sm font-medium text-foreground italic leading-relaxed">
                  "{current.phrase}"
                </p>
              </div>
              <p className="text-[11px] text-muted-foreground/70 leading-relaxed text-center">
                {current.subtext}
              </p>

              {/* Progress bar */}
              <div className="h-1 w-full rounded-full bg-secondary overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {/* Controls */}
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

              {/* Phase dots */}
              <div className="flex justify-center gap-1.5 pt-1">
                {PHASES.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 w-1.5 rounded-full transition-colors ${
                      i < phase ? "bg-primary" : i === phase ? "bg-primary/60" : "bg-muted"
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
                <Heart className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm font-medium text-foreground">You showed up for yourself</p>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
                That takes real courage. Carry this kindness with you through the rest of your day.
              </p>
              <button
                onClick={restart}
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

export default SelfCompassionWidget;
