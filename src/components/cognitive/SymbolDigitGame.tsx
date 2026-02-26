import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { useSaveSession } from "@/hooks/useCognitiveSessions";
import { toast } from "sonner";
import { RotateCcw, Trophy } from "lucide-react";
import DifficultySelector, { type Difficulty } from "./DifficultySelector";

const SYMBOLS = ["◆", "★", "▲", "●", "■", "♥", "♦", "♣", "✦"];

const TIME_LIMIT: Record<Difficulty, number> = { easy: 90, medium: 60, hard: 45 };
const ROUND_COUNT: Record<Difficulty, number> = { easy: 15, medium: 25, hard: 40 };

function shuffleMap(): Map<string, number> {
  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const shuffled = [...digits].sort(() => Math.random() - 0.5);
  const map = new Map<string, number>();
  SYMBOLS.forEach((s, i) => map.set(s, shuffled[i]));
  return map;
}

const SymbolDigitGame = () => {
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [phase, setPhase] = useState<"idle" | "playing" | "done">("idle");
  const [legend, setLegend] = useState<Map<string, number>>(new Map());
  const [sequence, setSequence] = useState<string[]>([]);
  const [current, setCurrent] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [errors, setErrors] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const startTimeRef = useRef(0);
  const saveSession = useSaveSession();

  const totalRounds = ROUND_COUNT[difficulty];
  const timeLimit = TIME_LIMIT[difficulty];

  const start = useCallback(() => {
    const map = shuffleMap();
    setLegend(map);
    const syms = Array.from({ length: totalRounds }, () =>
      SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
    );
    setSequence(syms);
    setCurrent(0);
    setCorrect(0);
    setErrors(0);
    setTimeLeft(timeLimit);
    startTimeRef.current = Date.now();
    setPhase("playing");
  }, [totalRounds, timeLimit]);

  useEffect(() => {
    if (phase !== "playing") return;
    const iv = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const remaining = Math.max(timeLimit - elapsed, 0);
      setTimeLeft(remaining);
      if (remaining <= 0) {
        setPhase("done");
        clearInterval(iv);
      }
    }, 250);
    return () => clearInterval(iv);
  }, [phase, timeLimit]);

  const finish = useCallback((finalCorrect: number, finalErrors: number, answered: number) => {
    setPhase("done");
    const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
    const accuracy = answered > 0 ? finalCorrect / answered : 0;
    const speed = duration > 0 ? (finalCorrect / duration) * 60 : 0;
    const score = Math.round(Math.min(accuracy * 50 + speed * 2, 100));
    saveSession.mutate({
      game_type: "symbol_digit",
      score,
      duration_seconds: duration,
      details: { correct: finalCorrect, errors: finalErrors, total: answered, difficulty },
    });
    toast.success(`🔢 Score: ${score} — ${finalCorrect} correct, ${finalErrors} errors`);
  }, [saveSession]);

  const handleDigit = (digit: number) => {
    if (phase !== "playing") return;
    const expected = legend.get(sequence[current]);
    const newCorrect = digit === expected ? correct + 1 : correct;
    const newErrors = digit !== expected ? errors + 1 : errors;
    setCorrect(newCorrect);
    setErrors(newErrors);
    const next = current + 1;
    setCurrent(next);
    if (next >= totalRounds) {
      finish(newCorrect, newErrors, next);
    }
  };

  const legendEntries = Array.from(legend.entries());

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <DifficultySelector value={difficulty} onChange={setDifficulty} disabled={phase === "playing"} />
        <button onClick={() => { setPhase("idle"); }} className="rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      {phase === "idle" && (
        <motion.button
          onClick={start}
          className="w-full rounded-2xl border-2 border-border bg-secondary p-10 text-center"
          whileTap={{ scale: 0.98 }}
        >
          <p className="text-lg font-semibold text-foreground">🔢 Tap to Start</p>
          <p className="text-xs text-muted-foreground mt-1">Match symbols to digits as fast as you can</p>
        </motion.button>
      )}

      {phase !== "idle" && (
        <>
          {/* Legend */}
          <div className="grid grid-cols-9 gap-1 rounded-xl bg-card border border-border p-2">
            {legendEntries.map(([sym, dig]) => (
              <div key={sym} className="text-center">
                <div className="text-lg">{sym}</div>
                <div className="text-xs font-bold text-primary">{dig}</div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{current}/{totalRounds}</span>
            <span className={timeLeft <= 10 ? "text-red-400 font-bold" : ""}>{timeLeft}s</span>
          </div>

          {phase === "playing" && (
            <>
              <div className="text-center py-4">
                <span className="text-5xl">{sequence[current]}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
                  <motion.button
                    key={d}
                    onClick={() => handleDigit(d)}
                    className="rounded-xl bg-secondary border border-border py-3 text-lg font-bold text-foreground hover:bg-primary/10 hover:border-primary/30 transition-colors"
                    whileTap={{ scale: 0.95 }}
                  >
                    {d}
                  </motion.button>
                ))}
              </div>
            </>
          )}

          {phase === "done" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-primary/10 border border-primary/30 p-4 text-center">
              <Trophy className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-lg font-bold text-foreground">{correct} correct</p>
              <p className="text-sm text-muted-foreground">{errors} errors out of {current} answered</p>
              <button onClick={start} className="mt-3 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground">Play Again</button>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
};

export default SymbolDigitGame;
