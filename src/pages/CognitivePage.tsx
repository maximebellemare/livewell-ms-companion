import { useState, useCallback } from "react";
import PullToRefresh from "@/components/PullToRefresh";
import { useQueryClient } from "@tanstack/react-query";
import SEOHead from "@/components/SEOHead";
import PageHeader from "@/components/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Brain, Zap, Hash, TrendingUp, Palette, Type, Grid3X3, Eye, Link, Target, LayoutGrid } from "lucide-react";
import MemoryMatchGame from "@/components/cognitive/MemoryMatchGame";
import ReactionTimeGame from "@/components/cognitive/ReactionTimeGame";
import SequenceRecallGame from "@/components/cognitive/SequenceRecallGame";
import StroopChallengeGame from "@/components/cognitive/StroopChallengeGame";
import WordScrambleGame from "@/components/cognitive/WordScrambleGame";
import SymbolDigitGame from "@/components/cognitive/SymbolDigitGame";
import NBackGame from "@/components/cognitive/NBackGame";
import TrailMakingGame from "@/components/cognitive/TrailMakingGame";
import PatternRecognitionGame from "@/components/cognitive/PatternRecognitionGame";
import GoNoGoGame from "@/components/cognitive/GoNoGoGame";
import CognitiveTrends from "@/components/cognitive/CognitiveTrends";
import CognitiveStreakBadge from "@/components/cognitive/CognitiveStreakBadge";
import { useBestScores } from "@/hooks/useCognitiveSessions";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

const GAMES = [
  { id: "memory", label: "Memory", icon: <Brain className="h-4 w-4" />, emoji: "🧠", title: "Memory Match", desc: "Find all matching pairs with as few moves as possible." },
  { id: "reaction", label: "Reaction", icon: <Zap className="h-4 w-4" />, emoji: "⚡", title: "Reaction Time", desc: "Wait for the green signal, then tap as fast as you can!" },
  { id: "sequence", label: "Sequence", icon: <Hash className="h-4 w-4" />, emoji: "🔢", title: "Sequence Recall", desc: "Watch and repeat growing number sequences." },
  { id: "stroop", label: "Stroop", icon: <Palette className="h-4 w-4" />, emoji: "🎨", title: "Stroop Challenge", desc: "Tap the ink color — not what it says! Trains selective attention." },
  { id: "scramble", label: "Scramble", icon: <Type className="h-4 w-4" />, emoji: "📝", title: "Word Scramble", desc: "Unscramble letters to form a word. Builds processing speed." },
  { id: "symbol", label: "Symbol", icon: <Grid3X3 className="h-4 w-4" />, emoji: "🔢", title: "Symbol Digit", desc: "Match symbols to digits — mirrors the SDMT clinical test." },
  { id: "nback", label: "N-Back", icon: <LayoutGrid className="h-4 w-4" />, emoji: "🧠", title: "N-Back", desc: "Tap when the letter matches N steps ago. Trains working memory." },
  { id: "trails", label: "Trails", icon: <Link className="h-4 w-4" />, emoji: "🔗", title: "Trail Making", desc: "Connect numbers/letters in order. Used in clinical neuropsych testing." },
  { id: "pattern", label: "Pattern", icon: <Eye className="h-4 w-4" />, emoji: "👁", title: "Pattern Recognition", desc: "Spot the odd one out in each grid." },
  { id: "gonogo", label: "Go/No-Go", icon: <Target className="h-4 w-4" />, emoji: "🎯", title: "Go / No-Go", desc: "Tap for green, hold for red. Trains inhibitory control." },
  { id: "trends", label: "Trends", icon: <TrendingUp className="h-4 w-4" />, emoji: "📊", title: "Trends", desc: "" },
];

const GAME_TYPE_MAP: Record<string, { icon: React.ReactNode; label: string }> = {
  memory_match: { icon: <Brain className="h-4 w-4 text-primary" />, label: "Memory" },
  reaction_time: { icon: <Zap className="h-4 w-4 text-primary" />, label: "Reaction" },
  sequence_recall: { icon: <Hash className="h-4 w-4 text-primary" />, label: "Sequence" },
  stroop_challenge: { icon: <Palette className="h-4 w-4 text-primary" />, label: "Stroop" },
  word_scramble: { icon: <Type className="h-4 w-4 text-primary" />, label: "Scramble" },
  symbol_digit: { icon: <Grid3X3 className="h-4 w-4 text-primary" />, label: "Symbol" },
  n_back: { icon: <LayoutGrid className="h-4 w-4 text-primary" />, label: "N-Back" },
  trail_making: { icon: <Link className="h-4 w-4 text-primary" />, label: "Trails" },
  pattern_recognition: { icon: <Eye className="h-4 w-4 text-primary" />, label: "Pattern" },
  go_no_go: { icon: <Target className="h-4 w-4 text-primary" />, label: "Go/No-Go" },
};

const GAME_COMPONENTS: Record<string, React.ReactNode> = {
  memory: <MemoryMatchGame />,
  reaction: <ReactionTimeGame />,
  sequence: <SequenceRecallGame />,
  stroop: <StroopChallengeGame />,
  scramble: <WordScrambleGame />,
  symbol: <SymbolDigitGame />,
  nback: <NBackGame />,
  trails: <TrailMakingGame />,
  pattern: <PatternRecognitionGame />,
  gonogo: <GoNoGoGame />,
};

const CognitivePage = () => {
  const { data: bestScores } = useBestScores();
  const queryClient = useQueryClient();
  const handleRefresh = useCallback(async () => { await queryClient.invalidateQueries({ queryKey: ["cognitive-sessions"] }); }, [queryClient]);

  return (
    <>
      <SEOHead title="Cognitive Games" description="Exercise your brain with fun mini-games and track cognitive trends." />
      <PageHeader title="Cognitive Games" subtitle="Train your brain 🧠" showBack />
      <PullToRefresh onRefresh={handleRefresh} className="mx-auto max-w-lg px-4 py-4 space-y-4 animate-fade-in">
        {/* MS cognitive health explainer */}
        <div className="rounded-2xl bg-gradient-to-br from-primary/8 via-accent/40 to-card p-4 border border-primary/10">
          <h3 className="text-sm font-semibold text-foreground mb-1.5">Why brain games for MS?</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Up to 65% of people with MS experience cognitive changes — especially in memory, processing speed, and attention. Regular cognitive exercise can help build <strong className="text-foreground font-medium">neuroplasticity</strong>, strengthen neural pathways, and maintain mental sharpness over time. Think of it as physiotherapy for your brain.
          </p>
        </div>

        <CognitiveStreakBadge />

        {/* Best scores summary */}
        {bestScores && Object.keys(bestScores).length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {Object.entries(bestScores).map(([gameType, session]) => {
              const meta = GAME_TYPE_MAP[gameType];
              if (!meta) return null;
              return (
                <div key={gameType} className="flex-shrink-0 min-w-[72px] rounded-xl bg-card p-3 shadow-soft text-center">
                  <div className="mx-auto mb-1 flex justify-center">{meta.icon}</div>
                  <p className="text-lg font-bold text-foreground">{session.score}</p>
                  <p className="text-[10px] text-muted-foreground">{meta.label}</p>
                </div>
              );
            })}
          </div>
        )}

        <Tabs defaultValue="memory">
          <ScrollArea className="w-full">
            <TabsList className="inline-flex w-max gap-0.5 p-1">
              {GAMES.map((g) => (
                <TabsTrigger key={g.id} value={g.id} className="flex items-center gap-1 text-[10px] px-2 py-1.5 whitespace-nowrap">
                  {g.icon} <span className="hidden sm:inline">{g.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          {GAMES.filter(g => g.id !== "trends").map((g) => (
            <TabsContent key={g.id} value={g.id} className="mt-4">
              <div className="rounded-xl bg-card p-4 shadow-soft">
                <h3 className="text-sm font-semibold text-foreground mb-3">{g.emoji} {g.title}</h3>
                <p className="text-xs text-muted-foreground mb-4">{g.desc}</p>
                {GAME_COMPONENTS[g.id]}
              </div>
            </TabsContent>
          ))}

          <TabsContent value="trends" className="mt-4">
            <CognitiveTrends days={30} />
          </TabsContent>
        </Tabs>
      </PullToRefresh>
    </>
  );
};

export default CognitivePage;
