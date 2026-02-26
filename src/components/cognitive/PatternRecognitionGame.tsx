import { useState, useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useSaveSession } from "@/hooks/useCognitiveSessions";
import { toast } from "sonner";
import { RotateCcw, Trophy } from "lucide-react";
import DifficultySelector, { type Difficulty } from "./DifficultySelector";

const SHAPES = ["●", "■", "▲", "◆", "★", "♥", "✦", "◗"];
const COLORS = [
  "text-red-500", "text-blue-500", "text-green-500", "text-amber-500",
  "text-purple-500", "text-pink-500", "text-cyan-500", "text-orange-500",
];

const GRID_SIZE: Record<Difficulty, number> = { easy: 4, medium: 6, hard: 9 };
const ROUNDS: Record<Difficulty, number> = { easy: 8, medium: 12, hard: 16 };

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateRound(gridSize: number): { items: { shape: string; color: string }[]; oddIndex: number } {
  const baseShape = pickRandom(SHAPES);
  const baseColor = pickRandom(COLORS);
  const items = Array.from({ length: gridSize }, () => ({ shape: baseShape, color: baseColor }));
  const oddIndex = Math.floor(Math.random() * gridSize);
  // Make the odd one different (change shape or color randomly)
  if (Math.random() > 0.5) {
    let diffShape: string;
    do { diffShape = pickRandom(SHAPES); } while (diffShape === baseShape);
    items[oddIndex] = { shape: diffShape, color: baseColor };
  } else {
    let diffColor: string;
    do { diffColor = pickRandom(COLORS); } while (diffColor === baseColor);
    items[oddIndex] = { shape: baseShape, color: diffColor };
  }
  return { items, oddIndex };
}

const PatternRecognitionGame = () => {
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [phase, setPhase] = useState<"idle" | "playing" | "done">("idle");
  const [round, setRound] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [errors, setErrors] = useState(0);
  const [currentRound, setCurrentRound] = useState<{ items: { shape: string; color: string }[]; oddIndex: number } | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const startRef = useRef(0);
  const saveSession = useSaveSession();

  const gridSize = GRID_SIZE[difficulty];
  const totalRounds = ROUNDS[difficulty];
  const cols = gridSize <= 4 ? 2 : 3;

  const nextRound = useCallback(() => {
    setCurrentRound(generateRound(gridSize));
    setFeedback(null);
  }, [gridSize]);

  const start = useCallback(() => {
    setRound(0);
    setCorrect(0);
    setErrors(0);
    startRef.current = Date.now();
    setPhase("playing");
    setCurrentRound(generateRound(gridSize));
    setFeedback(null);
  }, [gridSize]);

  const handleTap = (idx: number) => {
    if (phase !== "playing" || feedback) return;
    const isCorrect = idx === currentRound?.oddIndex;
    if (isCorrect) {
      setCorrect((c) => c + 1);
      setFeedback("correct");
    } else {
      setErrors((e) => e + 1);
      setFeedback("wrong");
    }
    const nextRoundNum = round + 1;
    setTimeout(() => {
      if (nextRoundNum >= totalRounds) {
        setRound(nextRoundNum);
        setPhase("done");
        const duration = Math.round((Date.now() - startRef.current) / 1000);
        const finalCorrect = isCorrect ? correct + 1 : correct;
        const score = Math.round(Math.max((finalCorrect / totalRounds) * 80 + Math.max(20 - duration * 0.3, 0), 10));
        saveSession.mutate({
          game_type: "pattern_recognition",
          score,
          duration_seconds: duration,
          details: { correct: finalCorrect, errors: errors + (isCorrect ? 0 : 1), rounds: totalRounds, difficulty },
        });
        toast.success(`👁 Pattern Score: ${score}`);
      } else {
        setRound(nextRoundNum);
        nextRound();
      }
    }, 500);
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
          <p className="text-lg font-semibold text-foreground">👁 Tap to Start</p>
          <p className="text-xs text-muted-foreground mt-1">Find the odd one out in each grid</p>
        </motion.button>
      )}

      {phase === "playing" && currentRound && (
        <>
          <div className="text-sm text-muted-foreground text-center">Round {round + 1}/{totalRounds} — {correct} correct</div>
          <div className={`grid gap-3 justify-center`} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
            {currentRound.items.map((item, i) => (
              <motion.button
                key={`${round}-${i}`}
                onClick={() => handleTap(i)}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
                className={`aspect-square rounded-xl bg-card border-2 flex items-center justify-center text-3xl transition-colors ${
                  feedback && i === currentRound.oddIndex
                    ? "border-green-500 bg-green-500/10"
                    : feedback === "wrong" && i !== currentRound.oddIndex
                    ? "border-border"
                    : "border-border hover:border-primary/30"
                }`}
                disabled={!!feedback}
              >
                <span className={item.color}>{item.shape}</span>
              </motion.button>
            ))}
          </div>
        </>
      )}

      {phase === "done" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-primary/10 border border-primary/30 p-4 text-center">
          <Trophy className="h-8 w-8 text-primary mx-auto mb-2" />
          <p className="text-lg font-bold text-foreground">{correct}/{totalRounds} correct</p>
          <p className="text-sm text-muted-foreground">{errors} mistake{errors !== 1 ? "s" : ""}</p>
          <button onClick={start} className="mt-3 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground">Play Again</button>
        </motion.div>
      )}
    </div>
  );
};

export default PatternRecognitionGame;
