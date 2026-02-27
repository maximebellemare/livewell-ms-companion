import { useState } from "react";
import { ArrowLeft, ChevronUp, MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { useDisplayName } from "@/hooks/useCommunity";
import {
  FeedbackStatus, useFeedbackPost, useFeedbackComments,
  useCreateFeedbackComment, useUpdateFeedbackStatus,
} from "@/hooks/useFeedback";

const STATUS_OPTIONS: { value: FeedbackStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "planned", label: "Planned" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
  { value: "declined", label: "Declined" },
];

const STATUS_BADGE: Record<string, string> = {
  new: "bg-muted text-muted-foreground",
  planned: "bg-primary/15 text-primary",
  in_progress: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  done: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  declined: "bg-destructive/15 text-destructive",
};

const CATEGORY_EMOJI: Record<string, string> = {
  feature: "✨", ui: "🎨", bug: "🐛", integration: "🔗", other: "💡",
};

export const FeedbackDetail = ({
  postId,
  onBack,
  roles,
  myUpvotes,
  onToggleUpvote,
}: {
  postId: string;
  onBack: () => void;
  roles: string[];
  myUpvotes: Set<string>;
  onToggleUpvote: (postId: string, isUpvoted: boolean) => void;
}) => {
  const { user } = useAuth();
  const { data: displayName = "Anonymous" } = useDisplayName();
  const { data: post, isLoading: postLoading } = useFeedbackPost(postId);
  const { data: comments = [], isLoading: commentsLoading } = useFeedbackComments(postId);
  const createComment = useCreateFeedbackComment();
  const updateStatus = useUpdateFeedbackStatus();
  const isAdmin = roles.includes("admin");

  const [commentBody, setCommentBody] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);

  const handleComment = async () => {
    if (!commentBody.trim() || !user) return;
    if (commentBody.trim().length > 1000) { toast.error("Comment must be under 1000 characters"); return; }
    try {
      await createComment.mutateAsync({
        post_id: postId,
        user_id: user.id,
        display_name: isAnonymous ? "Anonymous" : displayName,
        is_anonymous: isAnonymous,
        body: commentBody.trim(),
      });
      setCommentBody("");
      toast.success("Comment added!");
    } catch {
      toast.error("Failed to add comment");
    }
  };

  if (postLoading || !post) {
    return (
      <div className="space-y-3 animate-fade-in">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  const isUpvoted = myUpvotes.has(post.id);

  return (
    <div className="animate-fade-in">
      <button onClick={onBack} className="mb-3 text-sm font-medium text-primary flex items-center gap-1">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to ideas
      </button>

      {/* Post */}
      <div className="rounded-xl bg-card border border-border shadow-soft p-4 mb-4">
        <div className="flex items-start gap-3">
          {/* Upvote */}
          <button
            onClick={() => onToggleUpvote(post.id, isUpvoted)}
            className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors shrink-0 ${
              isUpvoted ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-primary hover:bg-primary/5"
            }`}
          >
            <ChevronUp className={`h-4 w-4 ${isUpvoted ? "fill-primary" : ""}`} />
            <span className="text-sm font-semibold">{post.upvotes_count}</span>
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              <span className="text-xs">{CATEGORY_EMOJI[post.category] ?? "💡"}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_BADGE[post.status]}`}>
                {STATUS_OPTIONS.find((s) => s.value === post.status)?.label ?? "New"}
              </span>
            </div>
            <h2 className="text-base font-semibold text-foreground">{post.title}</h2>
            <p className="text-sm text-foreground/80 mt-2 whitespace-pre-wrap">{post.body}</p>
            <div className="flex items-center gap-2 mt-3 text-[11px] text-muted-foreground">
              <span>{post.is_anonymous ? "Anonymous" : post.display_name}</span>
              <span>·</span>
              <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
            </div>
          </div>
        </div>

        {/* Admin status changer */}
        {isAdmin && (
          <div className="mt-3 pt-3 border-t border-border flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Status:</span>
            <Select
              value={post.status}
              onValueChange={(v) => updateStatus.mutate({ postId: post.id, status: v as FeedbackStatus })}
            >
              <SelectTrigger className="h-7 text-xs w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Comments */}
      <div className="flex items-center gap-1.5 mb-3">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">Discussion ({comments.length})</span>
      </div>

      {commentsLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-xs text-muted-foreground mb-4">No comments yet — be the first to share your thoughts.</p>
      ) : (
        <div className="space-y-2 mb-4">
          {comments.map((c) => (
            <div key={c.id} className="rounded-lg bg-muted/50 p-3">
              <p className="text-sm text-foreground whitespace-pre-wrap">{c.body}</p>
              <div className="flex items-center gap-2 mt-1.5 text-[11px] text-muted-foreground">
                <span>{c.is_anonymous ? "Anonymous" : c.display_name}</span>
                <span>·</span>
                <span>{formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add comment */}
      <div className="rounded-xl bg-card border border-border p-3 space-y-2">
        <Textarea
          placeholder="Add a comment…"
          value={commentBody}
          onChange={(e) => setCommentBody(e.target.value)}
          rows={2}
          maxLength={1000}
          className="text-sm"
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Switch id="anon-comment" checked={isAnonymous} onCheckedChange={setIsAnonymous} />
            <Label htmlFor="anon-comment" className="text-[11px] text-muted-foreground">Anonymous</Label>
          </div>
          <Button
            size="sm"
            onClick={handleComment}
            disabled={createComment.isPending || !commentBody.trim()}
          >
            <Send className="h-3.5 w-3.5 mr-1" />
            {createComment.isPending ? "Sending…" : "Comment"}
          </Button>
        </div>
      </div>
    </div>
  );
};
