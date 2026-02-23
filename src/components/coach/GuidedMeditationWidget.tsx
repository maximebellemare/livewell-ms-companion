import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, SkipForward, RotateCcw, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const MEDITATION_STEPS = [
  { name: "Settle In", instruction: "Find a comfortable position. Close your eyes and take three deep, slow breaths to arrive in this moment.", duration: 20 },
  { name: "Breath Awareness", instruction: "Breathe in for 4 counts… hold for 4… exhale for 6. Let each breath anchor you deeper into calm.", duration: 30 },
  { name: "Face & Jaw", instruction: "Soften your forehead, unclench your jaw. Let the muscles around your eyes relax completely.", duration: 20 },
  { name: "Shoulders & Neck", instruction: "On your next exhale, let your shoulders melt downward. Release any tension in your neck.", duration: 20 },
  { name: "Arms & Hands", instruction: "Feel warmth spreading from your shoulders down through your arms to your fingertips. Let them feel heavy.", duration: 20 },
  { name: "Chest & Heart", instruction: "Place your awareness on your heart space. Breathe gently into this area, feeling it expand with each inhale.", duration: 25 },
  { name: "Belly & Core", instruction: "Let your belly be soft and open. With each breath, feel tension dissolving from your core.", duration: 20 },
  { name: "Legs & Feet", instruction: "Scan down through your hips, legs, and feet. Feel the weight of your body fully supported.", duration: 20 },
  { name: "Whole Body", instruction: "Expand your awareness to your entire body. Notice the gentle rhythm of your breath moving through you.", duration: 25 },
  { name: "Closing", instruction: "When you're ready, gently wiggle your fingers and toes. Take one last deep breath and slowly open your eyes.", duration: 15 },
];

type Phase = "idle" | "active" | "transition" | "complete";

export const detectGuidedMeditation = (content: string): boolean => {
  const lower = content.toLowerCase();
  return (
    /guided\s*meditation/i.test(lower) ||
    /timed.*breathing.*relaxation/i.test(lower) ||
    /meditation.*breathing.*body/i.test(lower) ||
    /breathing.*body.*relaxation/i.test(lower) ||
    /relaxation.*meditation/i.test(lower) ||
    /meditation.*session.*begin/i.test(lower)
  );
};

const GuidedMeditationWidget = () => {
  const [phase, setPhase] = useState<Phase>("idle");
  const [stepIdx, setStepIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const step = MEDITATION_STEPS[stepIdx];
  const totalDuration = MEDITATION_STEPS.reduce((s, r) => s + r.duration, 0);
  const elapsedBefore = MEDITATION_STEPS.slice(0, stepIdx).reduce((s, r) => s + r.duration, 0);
  const overallProgress = ((elapsedBefore + elapsed) / totalDuration) * 100;

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const advance = useCallback(() => {
    clearTimer();
    if (stepIdx < MEDITATION_STEPS.length - 1) {
      setPhase("transition");
      setTimeout(() => {
        setStepIdx((i) => i + 1);
        setElapsed(0);
        setPhase("active");
      }, 1200);
    } else {
      setPhase("complete");
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    }
  }, [stepIdx, clearTimer]);

  useEffect(() => {
    if (phase !== "active" || isPaused) {
      clearTimer();
      return;
    }
    intervalRef.current = setInterval(() => {
      setElapsed((prev) => {
        if (prev + 1 >= step.duration) {
          advance();
          return prev;
        }
        return prev + 1;
      });
    }, 1000);
    return clearTimer;
  }, [phase, isPaused, step.duration, advance, clearTimer]);

  const start = () => {
    setStepIdx(0);
    setElapsed(0);
    setIsPaused(false);
    setPhase("active");
  };

  const reset = () => {
    clearTimer();
    setPhase("idle");
    setStepIdx(0);
    setElapsed(0);
    setIsPaused(false);
  };

  const pct = step ? (elapsed / step.duration) * 100 : 0;

  // Breathing circle animation
  const breathScale = phase === "active" && !isPaused
    ? 0.8 + 0.2 * Math.sin((elapsed / 5) * Math.PI)
    : 0.8;

  return (
    <div className="mt-3 rounded-xl border border-border bg-card p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">Guided Meditation</p>
          <p className="text-[11px] text-muted-foreground">{MEDITATION_STEPS.length} steps · ~{Math.round(totalDuration / 60)} min</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {phase === "idle" && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center space-y-3 py-2">
            <p className="text-xs text-muted-foreground leading-relaxed">A gentle guided session combining timed breathing with progressive body relaxation. Find a quiet space and get comfortable.</p>
            <button onClick={start} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground active:scale-95 transition-transform">
              <Play className="h-4 w-4" /> Begin Meditation
            </button>
          </motion.div>
        )}

        {(phase === "active" || phase === "transition") && (
          <motion.div key="active" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            {/* Breathing circle */}
            <div className="flex justify-center py-2">
              <motion.div
                className="h-20 w-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center"
                animate={{ scale: breathScale }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
              >
                <span className="text-lg font-bold text-primary tabular-nums">{step.duration - elapsed}</span>
              </motion.div>
            </div>

            {/* Step label */}
            <AnimatePresence mode="wait">
              <motion.div
                key={stepIdx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4 }}
                className="text-center space-y-1"
              >
                <p className="text-base font-semibold text-foreground">{step.name}</p>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">{step.instruction}</p>
              </motion.div>
            </AnimatePresence>

            {/* Step timer */}
            <Progress value={pct} className="h-2" />

            {/* Controls */}
            <div className="flex justify-center gap-3">
              <button onClick={() => setIsPaused((p) => !p)} className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-secondary text-foreground active:scale-95 transition-transform">
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </button>
              <button onClick={advance} className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-secondary text-foreground active:scale-95 transition-transform">
                <SkipForward className="h-4 w-4" />
              </button>
            </div>

            {/* Step dots */}
            <div className="flex justify-center gap-1 flex-wrap">
              {MEDITATION_STEPS.map((_, i) => (
                <span key={i} className={`h-2 w-2 rounded-full transition-colors ${i < stepIdx ? "bg-primary" : i === stepIdx ? "bg-primary/60 animate-pulse" : "bg-muted"}`} />
              ))}
            </div>

            {/* Overall progress */}
            <p className="text-[10px] text-muted-foreground/60 text-center">{Math.round(overallProgress)}% complete</p>
          </motion.div>
        )}

        {phase === "complete" && (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-3 py-2">
            <p className="text-sm font-medium text-foreground">Meditation Complete 🧘‍♀️</p>
            <p className="text-xs text-muted-foreground leading-relaxed">Well done. Carry this sense of calm with you. Notice how your body feels right now.</p>
            <button onClick={reset} className="inline-flex items-center gap-2 rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs text-foreground active:scale-95 transition-transform">
              <RotateCcw className="h-3.5 w-3.5" /> Start Over
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GuidedMeditationWidget;
