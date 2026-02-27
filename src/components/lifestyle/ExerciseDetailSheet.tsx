import { useState } from "react";
import { createPortal } from "react-dom";
import { X, MessageCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";

interface ExerciseInfo {
  name: string;
  sets?: string;
  reps?: string;
  rest?: string;
  instruction?: string;
  steps?: string[];
}

interface Props {
  exercise: ExerciseInfo | null;
  onClose: () => void;
  msType?: string | null;
}

export default function ExerciseDetailSheet({ exercise, onClose, msType }: Props) {
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  if (!exercise) return null;

  const askCoach = async () => {
    setLoadingAi(true);
    setAiExplanation(null);
    try {
      const { data, error } = await supabase.functions.invoke("exercise-correlation", {
        body: {
          mode: "coach_chat",
          msType,
          chatMessages: [
            {
              role: "user",
              content: `Explain in detail how to properly perform "${exercise.name}" with correct form. Include:
1. Starting position
2. Step-by-step movement
3. Common mistakes to avoid
4. MS-specific modifications (for balance, fatigue, or limited mobility)
5. Breathing pattern
Keep it friendly, concise, and practical.`,
            },
          ],
        },
      });
      if (error) throw error;
      setAiExplanation(data?.reply || "No response received.");
    } catch {
      setAiExplanation("Sorry, I couldn't get an explanation right now. Try again later.");
    } finally {
      setLoadingAi(false);
    }
  };

  return createPortal(
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/40"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-card shadow-lg"
      >
        <div className="flex justify-center pb-1 pt-3">
          <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
        </div>

        <div className="space-y-4 px-4 pb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-1">
              <h3 className="text-base font-bold text-foreground">{exercise.name}</h3>
              {(exercise.sets || exercise.reps) && (
                <p className="text-xs text-muted-foreground">
                  {exercise.sets && `${exercise.sets} sets`}
                  {exercise.reps && ` · ${exercise.reps}`}
                  {exercise.rest && ` · Rest: ${exercise.rest}`}
                </p>
              )}
            </div>
            <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>

          {exercise.instruction && (
            <div className="rounded-lg border border-primary/10 bg-primary/5 px-3 py-2">
              <p className="text-xs text-foreground">
                <span className="font-semibold">💡 Form tip:</span> {exercise.instruction}
              </p>
            </div>
          )}

          {exercise.steps && exercise.steps.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-foreground">📋 Step-by-Step</h4>
              <div className="space-y-1.5">
                {exercise.steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <span className="text-[10px] font-bold">{i + 1}</span>
                    </div>
                    <p className="flex-1 text-xs leading-relaxed text-foreground">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <button
              onClick={askCoach}
              disabled={loadingAi}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-secondary px-4 py-2.5 text-xs font-semibold text-foreground transition-all hover:bg-muted disabled:opacity-60"
            >
              {loadingAi ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <MessageCircle className="h-3.5 w-3.5" />
              )}
              {loadingAi ? "Asking coach…" : "Ask AI Coach how to do this"}
            </button>

            {aiExplanation && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="overflow-hidden rounded-lg bg-secondary/50 p-3"
              >
                <div className="prose prose-sm max-w-none text-xs text-foreground [&_h1]:text-sm [&_h2]:text-xs [&_h3]:text-xs [&_li]:text-xs [&_p]:text-xs [&_strong]:text-foreground">
                  <ReactMarkdown>{aiExplanation}</ReactMarkdown>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </>,
    document.body
  );
}
