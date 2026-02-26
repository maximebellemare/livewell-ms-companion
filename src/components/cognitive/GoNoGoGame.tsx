import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { useSaveSession } from "@/hooks/useCognitiveSessions";
import { toast } from "sonner";
import { RotateCcw, Trophy } from "lucide-react";
import DifficultySelector, { type Difficulty } from "./DifficultySelector";

const TOTAL: Record<Difficulty, number> = { easy: 15, medium: 25, hard: 35 };
const DISPLAY_MS: Record<Difficulty, number> = { easy: 1500, medium: 1100, hard: 800 };
const GO_RATE = 0.7;

const GoNoGoGame = () => {
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [phase, setPhase] = useState<"idle" | "playing" | "done">("idle");
  const [sequence, setSequence] = useState<boolean[]>([]);
  const [index, setIndex] = useState(0);
  const [responded, setResponded] = useState(false);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [falseAlarms, setFalseAlarms] = useState(0);
  const [correctRejects, setCorrectRejects] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const startRef = useRef(0);
  const saveSession = useSaveSession();

  const total = TOTAL[difficulty];
  const displayMs = DISPLAY_MS[difficulty];

  const start = useCallback(() => {
    const seq = Array.from({ length: total }, () => Math.random() < GO_RATE);
    setSequence(seq);
    setIndex(0);
    setHits(0);
    setMisses(0);
    setFalseAlarms(0);
    setCorrectRejects(0);
    setResponded(false);
    startRef.current = Date.now();
    setPhase("playing");
  }, [total]);

  const advance = useCallback(() => {
    setIndex((prev) => {
      const isGo = sequence[prev];
      if (!responded) {
        if (isGo) setMisses((m) => m + 1);
        else setCorrectRejects((c) => c + 1);
      }
      const next = prev + 1;
      if (next >= sequence.length) {
        setPhase("done");
        const duration = Math.round((Date.now() - startRef.current) / 1000);
        const goCount = sequence.filter(Boolean).length;
        const noGoCount = sequence.length - goCount;
        const hitRate = goCount > 0 ? hits / goCount : 0;
        const rejectRate = noGoCount > 0 ? (correctRejects + (!responded && !isGo ? 1 : 0)) / noGoCount : 0;
        const score = Math.round(Math.max(hitRate * 50 + rejectRate * 50, 10));
        saveSession.mutate({
          game_type: "go_no_go",
          score,
          duration_seconds: duration,
          details: { hits, misses: misses + (isGo && !responded ? 1 : 0), falseAlarms, correctRejects: correctRejects + (!isGo && !responded ? 1 : 0), difficulty },
        });
        toast.success(`🎯 Go/No-Go Score: ${score}`);
        return next;
      }
      setResponded(false);
      return next;
    });
  }, [sequence, responded, hits, misses, falseAlarms, correctRejects, difficulty, saveSession]);

  useEffect(() => {
    if (phase !== "playing" || index >= sequence.length) return;
    timerRef.current = setTimeout(advance, displayMs);
    return () => clearTimeout(timerRef.current);
  }, [phase, index, sequence.length, advance, displayMs]);

  const handleTap = () => {
    if (phase !== "playing" || responded) return;
    setResponded(true);
    if (sequence[index]) {
      setHits((h) => h + 1);
    } else {
      setFalseAlarms((f) => f + 1);
    }
  };

  const isGo = phase === "playing" && index < sequence.length ? sequence[index] : false;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <DifficultySelector value={difficulty} onChange={setDifficulty} disabled={phase === "playing"} />
        <button onClick={() => { clearTimeout(timerRef.current); setPhase("idle"); }} className="rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      {phase === "idle" && (
        <motion.button onClick={start} className="w-full rounded-2xl border-2 border-border bg-secondary p-10 text-center" whileTap={{ scale: 0.98 }}>
          <p className="text-lg font-semibold text-foreground">🎯 Tap to Start</p>
          <p className="text-xs text-muted-foreground mt-1">Tap for 🟢 green, <strong>don't tap</strong> for 🔴 red</p>
        </motion.button>
      )}

      {phase === "playing" && index < sequence.length && (
        <>
          <div className="text-sm text-muted-foreground text-center">{index + 1}/{sequence.length}</div>
          <motion.button
            key={index}
            onClick={handleTap}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`w-full rounded-2xl border-2 h-40 flex items-center justify-center transition-colors ${
              isGo
                ? "bg-green-500/15 border-green-500/40"
                : "bg-red-500/15 border-red-500/40"
            }`}
            whileTap={{ scale: 0.97 }}
          >
            <div className={`w-20 h-20 rounded-full ${isGo ? "bg-green-500" : "bg-red-500"}`} />
          </motion.button>
          {responded && (
            <p className="text-center text-xs text-primary font-medium">Tapped ✓</p>
          )}
        </>
      )}

      {phase === "done" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-primary/10 border border-primary/30 p-4 text-center">
          <Trophy className="h-8 w-8 text-primary mx-auto mb-2" />
          <p className="text-lg font-bold text-foreground">Go/No-Go Complete</p>
          <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-muted-foreground">
            <span>Hits: <strong className="text-foreground">{hits}</strong></span>
            <span>Misses: <strong className="text-foreground">{misses}</strong></span>
            <span>Correct rejects: <strong className="text-foreground">{correctRejects}</strong></span>
            <span>False alarms: <strong className="text-foreground">{falseAlarms}</strong></span>
          </div>
          <button onClick={start} className="mt-3 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground">Play Again</button>
        </motion.div>
      )}
    </div>
  );
};

export default GoNoGoGame;
