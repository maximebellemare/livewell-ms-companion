import { useState } from "react";
import { Plus, Search, ArrowUpDown, Lightbulb, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useDisplayName } from "@/hooks/useCommunity";
import {
  FeedbackCategory, FeedbackPost, useFeedbackPosts, useCreateFeedbackPost,
  useMyUpvotes, useToggleUpvote,
} from "@/hooks/useFeedback";
import { FeedbackPostCard } from "./FeedbackPostCard";
import { FeedbackDetail } from "./FeedbackDetail";
import AnimatedList, { listItemVariants } from "@/components/AnimatedList";
import { motion } from "framer-motion";

const CATEGORIES: { value: FeedbackCategory; label: string; emoji: string }[] = [
  { value: "feature", label: "Feature", emoji: "✨" },
  { value: "ui", label: "UI/UX", emoji: "🎨" },
  { value: "bug", label: "Bug", emoji: "🐛" },
  { value: "integration", label: "Integration", emoji: "🔗" },
  { value: "other", label: "Other", emoji: "💡" },
];

export const FeedbackBoard = ({ onBack, roles }: { onBack: () => void; roles: string[] }) => {
  const { user } = useAuth();
  const { data: displayName = "Anonymous" } = useDisplayName();
  const [sortBy, setSortBy] = useState<"popular" | "newest">("popular");
  const [filterCat, setFilterCat] = useState<FeedbackCategory | undefined>();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedPost, setSelectedPost] = useState<FeedbackPost | null>(null);

  // Create form state
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<FeedbackCategory>("feature");
  const [isAnonymous, setIsAnonymous] = useState(false);

  const { data: posts = [], isLoading } = useFeedbackPosts(sortBy, filterCat);
  const { data: myUpvotes = new Set() } = useMyUpvotes();
  const toggleUpvote = useToggleUpvote();
  const createPost = useCreateFeedbackPost();
  const isAdmin = roles.includes("admin");

  const filteredPosts = search.trim()
    ? posts.filter(
        (p) =>
          p.title.toLowerCase().includes(search.toLowerCase()) ||
          p.body.toLowerCase().includes(search.toLowerCase())
      )
    : posts;

  const handleSubmit = async () => {
    if (!title.trim() || !body.trim() || !user) return;
    if (title.trim().length > 150) { toast.error("Title must be under 150 characters"); return; }
    if (body.trim().length > 2000) { toast.error("Description must be under 2000 characters"); return; }
    try {
      await createPost.mutateAsync({
        user_id: user.id,
        display_name: isAnonymous ? "Anonymous" : displayName,
        is_anonymous: isAnonymous,
        title: title.trim(),
        body: body.trim(),
        category,
      });
      setTitle("");
      setBody("");
      setCategory("feature");
      setIsAnonymous(false);
      setShowCreate(false);
      toast.success("Idea submitted!");
    } catch {
      toast.error("Failed to submit idea");
    }
  };

  if (selectedPost) {
    return (
      <FeedbackDetail
        postId={selectedPost.id}
        onBack={() => setSelectedPost(null)}
        roles={roles}
        myUpvotes={myUpvotes}
        onToggleUpvote={(postId, isUpvoted) => toggleUpvote.mutate({ postId, isUpvoted })}
      />
    );
  }

  return (
    <div className="animate-fade-in">
      <button onClick={onBack} className="mb-3 text-sm font-medium text-primary flex items-center gap-1">
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </button>

      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="h-5 w-5 text-primary" />
        <div>
          <h2 className="text-base font-semibold text-foreground">Feedback Board</h2>
          <p className="text-[11px] text-muted-foreground">Share ideas & vote on features you'd love to see</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search ideas…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
      </div>

      {/* Sort & Filter */}
      <div className="flex items-center gap-1.5 mb-3 flex-wrap">
        <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        {(["popular", "newest"] as const).map((opt) => (
          <button
            key={opt}
            onClick={() => setSortBy(opt)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
              sortBy === opt ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {opt === "popular" ? "Most voted" : "Newest"}
          </button>
        ))}
        <span className="mx-1 text-muted-foreground/40">|</span>
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => setFilterCat(filterCat === c.value ? undefined : c.value)}
            className={`px-2 py-1 rounded-full text-[11px] font-medium transition-colors ${
              filterCat === c.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      {/* New Idea */}
      {!showCreate ? (
        <Button onClick={() => setShowCreate(true)} className="w-full mb-4" variant="outline">
          <Plus className="h-4 w-4 mr-2" /> Submit an Idea
        </Button>
      ) : (
        <div className="rounded-xl bg-card p-4 shadow-soft mb-4 space-y-3 border border-border">
          <Input placeholder="Idea title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={150} />
          <p className={`text-[10px] mt-0.5 text-right ${title.length > 130 ? "text-destructive" : "text-muted-foreground"}`}>{title.length}/150</p>

          <Textarea placeholder="Describe your idea…" value={body} onChange={(e) => setBody(e.target.value)} rows={3} maxLength={2000} />
          <p className={`text-[10px] mt-0.5 text-right ${body.length > 1800 ? "text-destructive" : "text-muted-foreground"}`}>{body.length}/2000</p>

          <Select value={category} onValueChange={(v) => setCategory(v as FeedbackCategory)}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.emoji} {c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Switch id="anon" checked={isAnonymous} onCheckedChange={setIsAnonymous} />
            <Label htmlFor="anon" className="text-xs text-muted-foreground">Post anonymously</Label>
          </div>

          {!isAnonymous && (
            <p className="text-[10px] text-muted-foreground">Posting as: <strong>{displayName}</strong></p>
          )}

          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={createPost.isPending || !title.trim() || !body.trim()} size="sm">
              {createPost.isPending ? "Submitting…" : "Submit"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setShowCreate(false); setTitle(""); setBody(""); }}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Posts list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl bg-card p-4 shadow-soft space-y-2 animate-pulse">
              <div className="h-4 w-3/4 bg-muted rounded" />
              <div className="h-3 w-full bg-muted rounded" />
              <div className="h-3 w-1/2 bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="rounded-2xl bg-card border border-border shadow-soft px-6 py-10 text-center space-y-3">
          <Lightbulb className="h-10 w-10 text-primary mx-auto opacity-50" />
          <h3 className="font-display text-base font-semibold text-foreground">
            {search.trim() ? "No matching ideas" : "No ideas yet"}
          </h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            {search.trim() ? "Try a different search." : "Be the first to share an idea!"}
          </p>
        </div>
      ) : (
        <AnimatedList className="space-y-3">
          {filteredPosts.map((post) => (
            <motion.div key={post.id} variants={listItemVariants}>
              <FeedbackPostCard
                post={post}
                isUpvoted={myUpvotes.has(post.id)}
                onUpvote={() => toggleUpvote.mutate({ postId: post.id, isUpvoted: myUpvotes.has(post.id) })}
                onClick={() => setSelectedPost(post)}
                isAdmin={isAdmin}
              />
            </motion.div>
          ))}
        </AnimatedList>
      )}
    </div>
  );
};
