import React, { useState } from "react";
import { LearningWorkspace, InterviewQuestion } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useWorkspaceStore } from "@/lib/workspace-store";
import { setCachedModule } from "@/lib/module-cache";
import { safeFetchJson } from "@/lib/safe-fetch";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronDown, MessageSquare, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type CategoryFilter = "all" | "basic" | "intermediate" | "advanced" | "scenario" | "hr" | "coding";

export function InterviewQuestionsModule({ workspace }: { workspace: LearningWorkspace }) {
  const { currentSessionId, updateSessionWorkspace, animationsEnabled } = useWorkspaceStore();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [expandedId, setExpandedId] = useState<number | null>(0);
  const [questions, setQuestions] = useState<InterviewQuestion[]>(workspace?.interviewQuestions || []);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  React.useEffect(() => {
    setQuestions(workspace?.interviewQuestions || []);
    setExpandedId(0);
  }, [workspace?.interviewQuestions]);

  const handleLoadMore = async () => {
    if (isLoadingMore || questions.length >= 50) return;
    setIsLoadingMore(true);
    setErrorMsg(null);

    try {
      const result = await safeFetchJson("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: workspace?.title || "",
          existingQuestions: questions.map((q) => q?.question || ""),
        }),
      });

      if (!result.ok) {
        throw new Error(result.error || "Failed to load more questions.");
      }

      const newQs = result.data?.interviewQuestions || [];
      if (Array.isArray(newQs) && newQs.length > 0) {
        const updated = [...questions, ...newQs];
        setQuestions(updated);

        if (workspace?.title) {
          await setCachedModule(workspace.title, "interview", { interviewQuestions: updated });
        }

        if (currentSessionId) {
          updateSessionWorkspace(currentSessionId, { interviewQuestions: updated });
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Error fetching additional interview questions.");
    } finally {
      setIsLoadingMore(false);
    }
  };

  const filteredQuestions = questions.filter((q, idx) => {
    if (!q) return false;
    const qText = q.question || "";
    const aText = q.answer || "";

    const matchesSearch =
      qText.toLowerCase().includes(search.toLowerCase()) ||
      aText.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (categoryFilter === "all") return true;

    if (idx === 0 && categoryFilter === "basic") return true;

    return (q.category || "").toLowerCase() === categoryFilter;
  });

  const difficultyColors = {
    easy: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    hard: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  };

  const categories: { id: CategoryFilter; label: string }[] = [
    { id: "all", label: "All Qs" },
    { id: "basic", label: "Basic" },
    { id: "intermediate", label: "Intermediate" },
    { id: "advanced", label: "Advanced" },
    { id: "scenario", label: "Scenario" },
    { id: "hr", label: "HR" },
    { id: "coding", label: "Coding" },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-semibold flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Interview Preparation
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {questions.length} questions loaded • Filter by difficulty or type
          </p>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search interview Qs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategoryFilter(c.id)}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border",
              categoryFilter === c.id
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-secondary/60 hover:bg-secondary border-border/50 text-muted-foreground hover:text-foreground"
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filteredQuestions.map((q, idx) => {
          const isExpanded = expandedId === idx;
          const diffKey = (q.difficulty ?? "medium") as keyof typeof difficultyColors;
          const diffColor = difficultyColors[diffKey] || difficultyColors.medium;

          return (
            <Card
              key={idx}
              className={cn(
                "border-border/60 transition-all overflow-hidden",
                isExpanded ? "border-primary/40 shadow-md bg-card" : "bg-card/60 hover:bg-card"
              )}
            >
              <CardContent className="p-0">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : idx)}
                  className="w-full p-4 md:p-5 flex items-start gap-4 text-left justify-between hover:no-underline"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      Q{idx + 1}
                    </span>
                    <div className="space-y-1 min-w-0">
                      <h3 className="font-semibold text-base leading-snug text-foreground">
                        {q.question || `Interview Question ${idx + 1}`}
                      </h3>
                      <div className="flex items-center gap-2 pt-1 flex-wrap">
                        {q.difficulty && (
                          <Badge variant="outline" className={cn("text-[11px] capitalize px-2 py-0 h-5", diffColor)}>
                            {q.difficulty}
                          </Badge>
                        )}
                        {q.category && (
                          <Badge variant="secondary" className="text-[11px] capitalize px-2 py-0 h-5 font-normal">
                            {q.category}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <ChevronDown
                    className={cn(
                      "w-5 h-5 text-muted-foreground shrink-0 transition-transform duration-200 mt-1",
                      isExpanded && "rotate-180 text-primary"
                    )}
                  />
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={animationsEnabled ? { height: 0, opacity: 0 } : undefined}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={animationsEnabled ? { height: 0, opacity: 0 } : undefined}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="px-5 pb-5 pt-1 border-t border-border/40 space-y-3 bg-muted/20">
                        <div className="text-xs font-bold text-primary tracking-wider uppercase font-mono pt-2">
                          Sample Answer &amp; Key Points
                        </div>
                        <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line bg-card p-4 rounded-xl border border-border/50">
                          {q.answer || "Answer details..."}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {errorMsg && (
        <p className="text-xs text-rose-500 font-medium text-center">{errorMsg}</p>
      )}

      {questions.length < 50 && (
        <div className="text-center pt-4">
          <Button
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            variant="outline"
            size="lg"
            className="rounded-full px-8 gap-2 border-primary/30 hover:bg-primary/5 hover:text-primary font-semibold"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Fetching 10 More Questions...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-primary" /> Load 10 More Interview Questions ({questions.length}/50)
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
