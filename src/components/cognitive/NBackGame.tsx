import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { useSaveSession } from "@/hooks/useCognitiveSessions";
import { toast } from "sonner";
import { RotateCcw, Trophy } from "lucide-react";
import DifficultySelector, { type Difficulty } from "./DifficultySelector";

const LETTERS = "BCDFGHJKLMNPQRSTVWXYZ".split("");
const N_VALUE: Record<Difficulty, number> = { easy: 1, medium: 2, hard: 3 };
const TOTAL_ITEMS: Record<Difficulty, number> = { easy: 15, medium: 20, hard: 25 };
const MATCH_RATE = 0.3;
const DISPLAY_MS = 2500;

function generateSequence(n: number, total: number): { letter: string; isMatch: boolean }[] {
  const seq: { letter: string; isMatch: boolean }[] = [];
  for (let i = 0; i < total; i++) {
    if (i >= n && Math.random() < MATCH_RATE) {
      seq.push({ letter: seq[i - n].letter, isMatch: true });
    } else {
      let letter: string;
      do {
        letter = LETTERS[Math.floor(Math.random() * LETTERS.length)];
      } while (i >= n && letter === seq[i - n].letter);
      seq.push({ letter, isMatch: false });
    }
  }
  return seq;
}

const NBackGame = () => {
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [phase, setPhase] = useState<"idle" | "playing" | "done">("idle");
  const [sequence, setSequence] = useState<{ letter: string; isMatch: boolean }[]>([]);
  const [index, setIndex] = useState(0);
  const [responded, setResponded] = useState(false);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [falseAlarms, setFalseAlarms] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const startTimeRef = useRef(0);
  const saveSession = useSaveSession();

  const n = N_VALUE[difficulty];
  const total = TOTAL_ITEMS[difficulty];

  const start = useCallback(() => {
    const seq = generateSequence(n, total);
    setSequence(seq);
    setIndex(0);
    setHits(0);
    setMisses(0);
    setFalseAlarms(0);
    setResponded(false);
    startTimeRef.current = Date.now();
    setPhase("playing");
  }, [n, total]);

  const advance = useCallback(() => {
    setIndex((prev) => {
      const current = prev;
      const item = sequence[current];
      if (!responded && item?.isMatch) {
        setMisses((m) => m + 1);
      }
      const next = current + 1;
      if (next >= sequence.length) {
        setPhase("done");
        const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
        const totalMatches = sequence.filter((s) => s.isMatch).length;
        const finalHits = hits + 0; // captured at this point
        const accuracy = totalMatches > 0 ? finalHits / totalMatches : 0;
        const score = Math.round(Math.max(accuracy * 70 + Math.max(30 - falseAlarms * 10, 0), 10));
        saveSession.mutate({
          game_type: "n_back",
          score,
          duration_seconds: duration,
          details: { n, hits: finalHits, misses: misses + (item?.isMatch && !responded ? 1 : 0), falseAlarms, total: sequence.length, difficulty },
        });
        toast.success(`🧠 N-Back Score: ${score}`);
        return next;
      }
      setResponded(false);
      return next;
    });
  }, [sequence, responded, hits, misses, falseAlarms, n, difficulty, saveSession]);

  useEffect(() => {
    if (phase !== "playing" || index >= sequence.length) return;
    timerRef.current = setTimeout(advance, DISPLAY_MS);
    return () => clearTimeout(timerRef.current);
  }, [phase, index, sequence.length, advance]);

  const handleMatch = () => {
    if (phase !== "playing" || responded) return;
    setResponded(true);
    const item = sequence[index];
    if (item.isMatch) {
      setHits((h) => h + 1);
    } else {
      setFalseAlarms((f) => f + 1);
    }
  };

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
          <p className="text-lg font-semibold text-foreground">🧠 Tap to Start</p>
          <p className="text-xs text-muted-foreground mt-1">Tap "Match" when the letter is the same as {n} step{n > 1 ? "s" : ""} ago</p>
        </motion.button>
      )}

      {phase === "playing" && index < sequence.length && (
        <>
          <div className="text-center text-xs text-muted-foreground">{index + 1}/{sequence.length} — {n}-Back</div>
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center justify-center rounded-2xl bg-card border border-border h-32"
          >
            <span className="text-5xl font-black text-foreground">{sequence[index].letter}</span>
          </motion.div>
          <motion.button
            onClick={handleMatch}
            disabled={responded}
            className={`w-full rounded-xl py-4 text-sm font-bold transition-colors ${
              responded
                ? "bg-primary/20 text-primary border border-primary/30"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
            whileTap={{ scale: 0.97 }}
          >
            {responded ? "Responded ✓" : "Match!"}
          </motion.button>
        </>
      )}

      {phase === "done" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-primary/10 border border-primary/30 p-4 text-center">
          <Trophy className="h-8 w-8 text-primary mx-auto mb-2" />
          <p className="text-lg font-bold text-foreground">{n}-Back Complete</p>
          <div className="flex justify-center gap-4 mt-2 text-sm text-muted-foreground">
            <span>Hits: <strong className="text-foreground">{hits}</strong></span>
            <span>Misses: <strong className="text-foreground">{misses}</strong></span>
            <span>False: <strong className="text-foreground">{falseAlarms}</strong></span>
          </div>
          <button onClick={start} className="mt-3 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground">Play Again</button>
        </motion.div>
      )}
    </div>
  );
};

export default NBackGame;
