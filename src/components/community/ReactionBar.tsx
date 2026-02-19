import { useState } from "react";
import { SmilePlus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useReactions, useToggleReaction } from "@/hooks/useCommunity";

const REACTIONS = [
  { type: "heart", emoji: "❤️" },
  { type: "thumbsup", emoji: "👍" },
  { type: "laugh", emoji: "😂" },
  { type: "wow", emoji: "😮" },
  { type: "pray", emoji: "🙏" },
  { type: "strong", emoji: "💪" },
] as const;

export type ReactionType = (typeof REACTIONS)[number]["type"];

interface ReactionBarProps {
  postId?: string;
  commentId?: string;
}

export const ReactionBar = ({ postId, commentId }: ReactionBarProps) => {
  const { user } = useAuth();
  const { data: reactions = {} } = useReactions(postId ?? null, commentId ?? null);
  const toggleReaction = useToggleReaction();
  const [showPicker, setShowPicker] = useState(false);

  const handleReact = (type: string) => {
    if (!user) return;
    const myReactions = reactions._my ?? [];
    const isReacted = myReactions.includes(type);
    toggleReaction.mutate({
      postId: postId ?? null,
      commentId: commentId ?? null,
      reactionType: type,
      isReacted,
    });
    setShowPicker(false);
  };

  // Build display: only show reactions that have counts
  const reactionEntries = REACTIONS.filter((r) => (reactions[r.type] ?? 0) > 0);

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {reactionEntries.map((r) => {
        const count = reactions[r.type] ?? 0;
        const myReactions = reactions._my ?? [];
        const isActive = myReactions.includes(r.type);
        return (
          <button
            key={r.type}
            onClick={() => handleReact(r.type)}
            className={`tap-highlight-none flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors border ${
              isActive
                ? "bg-primary/15 border-primary/30 text-foreground"
                : "bg-transparent border-border text-muted-foreground hover:border-primary/30"
            }`}
          >
            <span className="text-xs">{r.emoji}</span>
            <span className="tabular-nums">{count}</span>
          </button>
        );
      })}

      {/* Add reaction trigger */}
      <div className="relative">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="tap-highlight-none flex items-center justify-center rounded-full h-6 w-6 text-muted-foreground hover:text-primary hover:bg-secondary transition-colors"
        >
          <SmilePlus className="h-3.5 w-3.5" />
        </button>

        {showPicker && (
          <>
            {/* Backdrop to close picker */}
            <div className="fixed inset-0 z-40" onClick={() => setShowPicker(false)} />
            <div className="absolute bottom-full left-0 mb-1 z-50 flex gap-1 rounded-xl bg-card border border-border shadow-lg p-1.5 animate-fade-in">
              {REACTIONS.map((r) => {
                const myReactions = reactions._my ?? [];
                const isActive = myReactions.includes(r.type);
                return (
                  <button
                    key={r.type}
                    onClick={() => handleReact(r.type)}
                    className={`tap-highlight-none text-base rounded-lg p-1.5 transition-all hover:scale-125 hover:bg-secondary ${
                      isActive ? "bg-primary/15" : ""
                    }`}
                    title={r.type}
                  >
                    {r.emoji}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
