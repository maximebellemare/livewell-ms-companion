import { ChevronUp, MessageSquare } from "lucide-react";
import { FeedbackPost } from "@/hooks/useFeedback";
import { formatDistanceToNow } from "date-fns";

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  new: { label: "New", className: "bg-muted text-muted-foreground" },
  planned: { label: "Planned", className: "bg-primary/15 text-primary" },
  in_progress: { label: "In Progress", className: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  done: { label: "Done", className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
  declined: { label: "Declined", className: "bg-destructive/15 text-destructive" },
};

const CATEGORY_EMOJI: Record<string, string> = {
  feature: "✨",
  ui: "🎨",
  bug: "🐛",
  integration: "🔗",
  other: "💡",
};

export const FeedbackPostCard = ({
  post,
  isUpvoted,
  onUpvote,
  onClick,
  isAdmin,
}: {
  post: FeedbackPost;
  isUpvoted: boolean;
  onUpvote: () => void;
  onClick: () => void;
  isAdmin: boolean;
}) => {
  const status = STATUS_LABELS[post.status] ?? STATUS_LABELS.new;

  return (
    <div className="rounded-xl bg-card border border-border shadow-soft flex overflow-hidden transition-colors hover:bg-accent/30">
      {/* Upvote column */}
      <button
        onClick={(e) => { e.stopPropagation(); onUpvote(); }}
        className={`flex flex-col items-center justify-center px-3 py-3 gap-0.5 border-r border-border transition-colors shrink-0 ${
          isUpvoted ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-primary hover:bg-primary/5"
        }`}
      >
        <ChevronUp className={`h-4 w-4 ${isUpvoted ? "fill-primary" : ""}`} />
        <span className="text-sm font-semibold">{post.upvotes_count}</span>
      </button>

      {/* Content */}
      <button onClick={onClick} className="flex-1 p-3 text-left min-w-0">
        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
          <span className="text-xs">{CATEGORY_EMOJI[post.category] ?? "💡"}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${status.className}`}>
            {status.label}
          </span>
        </div>
        <h3 className="text-sm font-semibold text-foreground line-clamp-2 leading-snug">{post.title}</h3>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{post.body}</p>
        <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
          <span>{post.is_anonymous ? "Anonymous" : post.display_name}</span>
          <span>·</span>
          <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
          <span className="flex items-center gap-0.5 ml-auto">
            <MessageSquare className="h-3 w-3" /> {post.comments_count}
          </span>
        </div>
      </button>
    </div>
  );
};
