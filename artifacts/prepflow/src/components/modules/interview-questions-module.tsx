import React, { useState } from "react";
import { LearningWorkspace, InterviewQuestion } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useWorkspaceStore } from "@/lib/workspace-store";
import { setCachedModule } from "@/lib/module-cache";
import { safeFetchJson } from "@/lib/safe-fetch";
import { getApiUrl } from "@/lib/api-config";
import { getFallbackInterviewQuestions } from "@/lib/fallback-generators";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronDown, MessageSquare, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type CategoryFilter = "all" | "basic" | "intermediate" | "advanced" | "scenario" | "hr" | "coding";

export function InterviewQuestionsModule({ workspace }: { workspace: LearningWorkspace }) {
  const { currentSessionId, updateSessionWorkspace, animationsEnabled } = useWorkspaceStore();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [expandedId, setExpandedId] = useState<number | null>(0);

  const initialQuestions = (Array.isArray(workspace?.interviewQuestions) && workspace.interviewQuestions.length >= 50)
    ? workspace.interviewQuestions
    : getFallbackInterviewQuestions(workspace?.title || "Topic");

  const [questions, setQuestions] = useState<InterviewQuestion[]>(initialQuestions);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  React.useEffect(() => {
    const updated = (Array.isArray(workspace?.interviewQuestions) && workspace.interviewQuestions.length >= 50)
      ? workspace.interviewQuestions
      : getFallbackInterviewQuestions(workspace?.title || "Topic");
    setQuestions(updated);
    setExpandedId(0);
  }, [workspace?.interviewQuestions, workspace?.title]);

  const handleLoadMore = async () => {
    if (isLoadingMore || questions.length >= 50) return;
    setIsLoadingMore(true);
    setErrorMsg(null);

    try {
      const url = getApiUrl("/api/interview");
      const result = await safeFetchJson(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: workspace?.title || "",
          existingQuestions: questions.map((q) => q?.question || ""),
        }),
      });

      const newQs = (result.ok && Array.isArray(result.data?.interviewQuestions) && result.data.interviewQuestions.length > 0)
        ? result.data.interviewQuestions
        : getFallbackInterviewQuestions(workspace?.title || "Topic");
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

  const filteredQuestions = questions.filter((q) => {
    if (!q) return false;
    const qText = (q.question || "").toLowerCase();
    const aText = (q.answer || "").toLowerCase();
    const catText = (q.category || "").toLowerCase();

    const matchesSearch =
      qText.includes(search.toLowerCase()) ||
      aText.includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (categoryFilter === "all") return true;

    if (categoryFilter === "basic") return catText.includes("basic");
    if (categoryFilter === "intermediate") return catText.includes("intermed");
    if (categoryFilter === "advanced") return catText.includes("advanc");
    if (categoryFilter === "scenario") return catText.includes("scenario") || catText.includes("situation");
    if (categoryFilter === "hr") return catText.includes("hr") || catText.includes("behavioural") || catText.includes("behavioral");
    if (categoryFilter === "coding") return catText.includes("coding") || catText.includes("code");

    return true;
  });

  const difficultyColors: Record<string, string> = {
    easy: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    hard: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  };

  const categories: { id: CategoryFilter; label: string; count: number }[] = [
    { id: "all", label: "All Qs", count: questions.length },
    { id: "basic", label: "Basic", count: questions.filter(q => (q.category || "").toLowerCase().includes("basic")).length },
    { id: "intermediate", label: "Intermediate", count: questions.filter(q => (q.category || "").toLowerCase().includes("intermed")).length },
    { id: "advanced", label: "Advanced", count: questions.filter(q => (q.category || "").toLowerCase().includes("advanc")).length },
    { id: "scenario", label: "Scenario", count: questions.filter(q => (q.category || "").toLowerCase().includes("scenario")).length },
    { id: "hr", label: "HR", count: questions.filter(q => (q.category || "").toLowerCase().includes("hr") || (q.category || "").toLowerCase().includes("behavioural")).length },
    { id: "coding", label: "Coding", count: questions.filter(q => (q.category || "").toLowerCase().includes("coding") || (q.category || "").toLowerCase().includes("code")).length },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-display font-semibold flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Technical Interview Preparation ({questions.length} Questions)
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            50 categorized interview questions with answers, explanations, and difficulty ratings
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
          <Input
            placeholder="Search questions or answers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card border-border/60"
          />
        </div>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 no-scrollbar">
        {categories.map((cat) => (
          <Button
            key={cat.id}
            variant={categoryFilter === cat.id ? "default" : "outline"}
            size="sm"
            onClick={() => setCategoryFilter(cat.id)}
            className="rounded-full text-xs gap-1.5 shrink-0"
          >
            <span>{cat.label}</span>
            <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
              {cat.count}
            </Badge>
          </Button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredQuestions.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground">
            <p className="text-sm font-medium">No interview questions match your current search or category filter.</p>
          </Card>
        ) : (
          filteredQuestions.map((q, index) => {
            const isExpanded = expandedId === index;
            const diffKey = (q.difficulty || "medium").toLowerCase();
            const badgeStyle = difficultyColors[diffKey] || difficultyColors.medium;

            return (
              <motion.div
                key={index}
                initial={animationsEnabled ? { opacity: 0, y: 10 } : undefined}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.02, 0.3) }}
              >
                <Card className="border-border/60 overflow-hidden hover:border-primary/40 transition-colors">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : index)}
                    className="w-full text-left p-5 flex items-start justify-between gap-4 bg-card hover:bg-muted/30 transition-colors"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className={cn("text-xs font-semibold uppercase", badgeStyle)}>
                          {q.difficulty || "Medium"}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {q.category || "General"}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-base text-foreground leading-snug">
                        {index + 1}. {q.question}
                      </h3>
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
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <CardContent className="p-5 pt-0 border-t border-border/40 bg-muted/20 space-y-4">
                          <div className="pt-4 space-y-2">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Model Answer</h4>
                            <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                              {q.answer}
                            </p>
                          </div>

                          {q.explanation && (
                            <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 space-y-1">
                              <h4 className="text-xs font-bold text-primary flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5" /> Conceptual Explanation & Key Takeaways
                              </h4>
                              <p className="text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap">
                                {q.explanation}
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>

      {questions.length < 50 && (
        <div className="text-center pt-4">
          <Button onClick={handleLoadMore} disabled={isLoadingMore} variant="outline" className="gap-2">
            {isLoadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-primary" />}
            Load More Questions ({50 - questions.length} remaining)
          </Button>
          {errorMsg && <p className="text-xs text-rose-500 mt-2">{errorMsg}</p>}
        </div>
      )}
    </div>
  );
}
