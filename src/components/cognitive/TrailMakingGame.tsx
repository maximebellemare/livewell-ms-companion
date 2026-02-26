import { useState, useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useSaveSession } from "@/hooks/useCognitiveSessions";
import { toast } from "sonner";
import { RotateCcw, Trophy } from "lucide-react";
import DifficultySelector, { type Difficulty } from "./DifficultySelector";

const CONFIG: Record<Difficulty, { count: number; mode: "numbers" | "alternating" }> = {
  easy: { count: 8, mode: "numbers" },
  medium: { count: 10, mode: "alternating" },
  hard: { count: 14, mode: "alternating" },
};

function buildSequence(count: number, mode: "numbers" | "alternating"): string[] {
  if (mode === "numbers") return Array.from({ length: count }, (_, i) => String(i + 1));
  const seq: string[] = [];
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const pairs = Math.floor(count / 2);
  for (let i = 0; i < pairs; i++) {
    seq.push(String(i + 1));
    seq.push(letters[i]);
  }
  return seq;
}

function randomPositions(count: number, width: number, height: number) {
  const positions: { x: number; y: number }[] = [];
  const minDist = 52;
  for (let i = 0; i < count; i++) {
    let tries = 0;
    let x: number, y: number;
    do {
      x = 24 + Math.random() * (width - 48);
      y = 24 + Math.random() * (height - 48);
      tries++;
    } while (
      tries < 200 &&
      positions.some((p) => Math.hypot(p.x - x, p.y - y) < minDist)
    );
    positions.push({ x, y });
  }
  return positions;
}

const TrailMakingGame = () => {
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [phase, setPhase] = useState<"idle" | "playing" | "done">("idle");
  const [sequence, setSequence] = useState<string[]>([]);
  const [positions, setPositions] = useState<{ x: number; y: number }[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [errors, setErrors] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const saveSession = useSaveSession();

  const { count, mode } = CONFIG[difficulty];

  const start = useCallback(() => {
    const seq = buildSequence(count, mode);
    setSequence(seq);
    const w = containerRef.current?.clientWidth ?? 300;
    setPositions(randomPositions(seq.length, w, 280));
    setCurrentIdx(0);
    setErrors(0);
    setElapsed(0);
    startRef.current = Date.now();
    setPhase("playing");
  }, [count, mode]);

  useEffect(() => {
    if (phase !== "playing") return;
    const iv = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 250);
    return () => clearInterval(iv);
  }, [phase]);

  const handleTap = (idx: number) => {
    if (phase !== "playing") return;
    if (idx === currentIdx) {
      const next = currentIdx + 1;
      setCurrentIdx(next);
      if (next >= sequence.length) {
        setPhase("done");
        const duration = Math.round((Date.now() - startRef.current) / 1000);
        const score = Math.round(Math.max(100 - duration * 1.5 - errors * 5, 10));
        saveSession.mutate({
          game_type: "trail_making",
          score,
          duration_seconds: duration,
          details: { errors, items: sequence.length, mode, difficulty },
        });
        toast.success(`🔗 Trail complete! Score: ${score}`);
      }
    } else {
      setErrors((e) => e + 1);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <DifficultySelector value={difficulty} onChange={setDifficulty} disabled={phase === "playing"} />
        <button onClick={() => setPhase("idle")} className="rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      {phase === "idle" && (
        <motion.button onClick={start} className="w-full rounded-2xl border-2 border-border bg-secondary p-10 text-center" whileTap={{ scale: 0.98 }}>
          <p className="text-lg font-semibold text-foreground">🔗 Tap to Start</p>
          <p className="text-xs text-muted-foreground mt-1">
            {mode === "numbers" ? "Tap numbers in order: 1 → 2 → 3…" : "Alternate: 1 → A → 2 → B → 3 → C…"}
          </p>
        </motion.button>
      )}

      {phase !== "idle" && (
        <>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Next: <strong className="text-foreground">{sequence[currentIdx] ?? "—"}</strong></span>
            <span>{elapsed}s · {errors} errors</span>
          </div>

          <div ref={containerRef} className="relative rounded-2xl bg-card border border-border h-[280px] overflow-hidden">
            {sequence.map((label, i) => (
              <motion.button
                key={i}
                onClick={() => handleTap(i)}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.04 }}
                className={`absolute w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  i < currentIdx
                    ? "bg-primary/20 text-primary/50 border border-primary/20"
                    : "bg-secondary border-2 border-border text-foreground hover:border-primary/40"
                }`}
                style={{ left: positions[i]?.x - 20, top: positions[i]?.y - 20 }}
                disabled={i < currentIdx || phase === "done"}
              >
                {label}
              </motion.button>
            ))}
          </div>

          {phase === "done" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-primary/10 border border-primary/30 p-4 text-center">
              <Trophy className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-lg font-bold text-foreground">Completed in {elapsed}s</p>
              <p className="text-sm text-muted-foreground">{errors} error{errors !== 1 ? "s" : ""}</p>
              <button onClick={start} className="mt-3 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground">Play Again</button>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
};

export default TrailMakingGame;
