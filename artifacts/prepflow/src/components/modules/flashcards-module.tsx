import React, { useState, useEffect } from "react";
import { LearningWorkspace } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Shuffle,
  CheckCircle2,
  RotateCcw,
  Bookmark,
  Sparkles,
  Layers,
} from "lucide-react";
import { useWorkspaceStore } from "@/lib/workspace-store";
import { getFallbackFlashcards } from "@/lib/fallback-generators";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function FlashcardsModule({ workspace }: { workspace: LearningWorkspace }) {
  const { animationsEnabled, currentSessionId, toggleBookmark, isBookmarked } = useWorkspaceStore();
  const initialCards = (Array.isArray(workspace.flashcards) && workspace.flashcards.length >= 12)
    ? workspace.flashcards
    : getFallbackFlashcards(workspace.title || "Topic");

  const [cards, setCards] = useState(initialCards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [learned, setLearned] = useState<Set<number>>(new Set());

  // Reset when workspace changes
  useEffect(() => {
    const updated = (Array.isArray(workspace.flashcards) && workspace.flashcards.length >= 12)
      ? workspace.flashcards
      : getFallbackFlashcards(workspace.title || "Topic");
    setCards(updated);
    setCurrentIndex(0);
    setIsFlipped(false);
    setLearned(new Set());
  }, [workspace.flashcards, workspace.title]);

  // Keyboard navigation — use refs to avoid stale closure
  const currentIndexRef = React.useRef(currentIndex);
  const cardsLengthRef = React.useRef(cards.length);
  currentIndexRef.current = currentIndex;
  cardsLengthRef.current = cards.length;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowLeft") {
        if (currentIndexRef.current > 0) {
          setIsFlipped(false);
          setTimeout(() => setCurrentIndex((c) => c - 1), 150);
        }
      }
      if (e.key === "ArrowRight") {
        if (currentIndexRef.current < cardsLengthRef.current - 1) {
          setIsFlipped(false);
          setTimeout(() => setCurrentIndex((c) => c + 1), 150);
        }
      }
      if (e.key === " ") {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []); // stable — uses refs

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex((c) => c + 1), 150);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex((c) => c - 1), 150);
    }
  };

  const handleShuffle = () => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const toggleLearned = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setLearned((prev) => {
      const next = new Set(prev);
      if (next.has(currentIndex)) {
        next.delete(currentIndex);
      } else {
        next.add(currentIndex);
      }
      return next;
    });
  };

  // Guard: no cards available — show loading state
  if (cards.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Layers className="w-10 h-10 mx-auto mb-3 opacity-40 animate-pulse" />
        <p className="text-sm animate-pulse">Loading flashcards...</p>
        <div className="mt-4 space-y-3 max-w-md mx-auto">
          <div className="h-24 bg-muted/50 rounded-xl animate-pulse" />
          <div className="h-4 bg-muted/30 rounded w-3/4 mx-auto animate-pulse" />
        </div>
      </div>
    );
  }

  const currentCard = cards[currentIndex] ?? cards[0];
  const bookmarked = currentSessionId ? isBookmarked(currentSessionId, currentIndex) : false;
  const progress = cards.length > 0 ? (learned.size / cards.length) * 100 : 0;
  const isAllLearned = learned.size === cards.length && cards.length > 0;

  const difficultyColors = {
    easy: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    hard: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  };

  return (
    <motion.div
      initial={animationsEnabled ? { opacity: 0, y: 10 } : undefined}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-display font-semibold flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            Interactive Flashcards
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Card {currentIndex + 1} of {cards.length} • {learned.size} Mastered
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleShuffle} className="gap-2">
            <Shuffle className="w-4 h-4" /> Shuffle
          </Button>
        </div>
      </div>

      <Progress value={progress} className="h-2" />

      {isAllLearned ? (
        <Card className="text-center py-16 bg-emerald-500/10 border-emerald-500/20">
          <CardContent className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-2xl font-bold font-display">All Mastered! 🎉</h3>
              <p className="text-muted-foreground mt-2">You've successfully completed all flashcards in this deck.</p>
            </div>
            <Button onClick={() => setLearned(new Set())} className="mt-4" variant="outline">
              <RotateCcw className="w-4 h-4 mr-2" /> Reset Deck Progress
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="perspective-1000 min-h-[340px]">
          <motion.div
            className="relative w-full h-full min-h-[340px] transform-style-3d cursor-pointer"
            initial={false}
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
            onClick={() => setIsFlipped(!isFlipped)}
          >
            {/* Front */}
            <Card className="absolute inset-0 backface-hidden w-full h-full flex flex-col justify-between p-8 bg-card hover:border-primary/50 transition-colors shadow-lg border-2 border-border/60">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" /> Question
                </span>
                <div className="flex items-center gap-2">
                  {currentCard?.category && (
                    <Badge variant="outline" className="text-xs font-normal">
                      {currentCard.category}
                    </Badge>
                  )}
                  {currentCard?.difficulty && (
                    <Badge className={cn("text-xs font-medium border uppercase tracking-wider", difficultyColors[currentCard.difficulty])}>
                      {currentCard.difficulty}
                    </Badge>
                  )}
                  {currentSessionId && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleBookmark(currentSessionId, currentIndex);
                      }}
                      className={cn(
                        "p-1.5 rounded-full hover:bg-secondary transition-colors",
                        bookmarked ? "text-amber-500" : "text-muted-foreground"
                      )}
                      title={bookmarked ? "Bookmarked" : "Bookmark card"}
                    >
                      <Bookmark className="w-4 h-4" fill={bookmarked ? "currentColor" : "none"} />
                    </button>
                  )}
                </div>
              </div>

              <div className="my-auto text-center px-4">
                <p className={cn("text-2xl font-medium leading-relaxed", learned.has(currentIndex) && "opacity-50 line-through")}>
                  {currentCard?.front}
                </p>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 bg-secondary rounded font-mono text-[10px]">Space</kbd> Flip card
                </span>
                {learned.has(currentIndex) && (
                  <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-none">
                    Learned ✓
                  </Badge>
                )}
              </div>
            </Card>

            {/* Back */}
            <Card className="absolute inset-0 backface-hidden w-full h-full flex flex-col justify-between p-8 bg-primary text-primary-foreground rotate-y-180 shadow-xl border-2 border-primary">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-primary-foreground/70 uppercase tracking-widest">
                  Answer
                </span>
                {currentCard?.category && (
                  <Badge variant="outline" className="text-xs font-normal border-primary-foreground/30 text-primary-foreground">
                    {currentCard.category}
                  </Badge>
                )}
              </div>

              <div className="my-auto text-center px-4">
                <p className="text-xl leading-relaxed font-medium">
                  {currentCard?.back}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={toggleLearned}
                  className="gap-2 font-semibold"
                >
                  {learned.has(currentIndex) ? (
                    <>Mark Unlearned</>
                  ) : (
                    <><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Mark Learned</>
                  )}
                </Button>
                <span className="text-xs text-primary-foreground/70">Click to flip back</span>
              </div>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-2">
        <Button
          variant="outline"
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="w-32 gap-2"
        >
          <ChevronLeft className="w-4 h-4" /> Prev
        </Button>

        <div className="hidden sm:flex text-xs text-muted-foreground gap-4">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-secondary rounded font-mono">←</kbd> Prev
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-secondary rounded font-mono">→</kbd> Next
          </span>
        </div>

        <Button
          onClick={handleNext}
          disabled={currentIndex === cards.length - 1}
          className="w-32 gap-2"
        >
          Next <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}
