import React, { useState, useMemo, useCallback } from "react";
import { LearningWorkspace, QuizQuestion } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useWorkspaceStore } from "@/lib/workspace-store";
import { setCachedModule } from "@/lib/module-cache";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  Award,
  Eye,
  Sparkles,
  Target,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  BrainCircuit,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Confetti } from "@/components/ui/confetti";

interface AnswerRecord {
  questionIndex: number;
  selectedOption: number;
  isCorrect: boolean;
}

type QuizView = "quiz" | "results" | "review" | "retry";

function OptionButton({
  label,
  option,
  index,
  selectedOption,
  showFeedback,
  correctIndex,
  onClick,
}: {
  label: string;
  option: string;
  index: number;
  selectedOption: number | null;
  showFeedback: boolean;
  correctIndex: number;
  onClick: () => void;
}) {
  const isSelected = selectedOption === index;
  const isCorrect = index === correctIndex;

  let btnStyle = "border-border/60 bg-card hover:bg-secondary/60 hover:border-primary/40";
  let badgeStyle = "bg-secondary text-muted-foreground";

  if (showFeedback) {
    if (isCorrect) {
      btnStyle = "border-emerald-500/50 bg-emerald-500/10 text-emerald-950 dark:text-emerald-200 font-medium";
      badgeStyle = "bg-emerald-500 text-white font-bold";
    } else if (isSelected && !isCorrect) {
      btnStyle = "border-red-500/50 bg-red-500/10 text-red-950 dark:text-red-200 font-medium";
      badgeStyle = "bg-red-500 text-white font-bold";
    } else {
      btnStyle = "border-border/40 bg-card/40 opacity-50";
    }
  } else if (isSelected) {
    btnStyle = "border-primary bg-primary/10 text-foreground font-medium";
    badgeStyle = "bg-primary text-primary-foreground font-bold";
  }

  return (
    <button
      onClick={onClick}
      disabled={showFeedback}
      className={cn(
        "w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-center justify-between gap-3 group relative overflow-hidden",
        btnStyle
      )}
    >
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        <span
          className={cn(
            "w-7 h-7 rounded-lg text-xs font-mono flex items-center justify-center shrink-0 transition-colors",
            badgeStyle
          )}
        >
          {label}
        </span>
        <span className="text-sm md:text-base leading-snug">{option}</span>
      </div>

      {showFeedback && (
        <div className="shrink-0">
          {isCorrect ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          ) : isSelected ? (
            <XCircle className="w-5 h-5 text-red-500" />
          ) : null}
        </div>
      )}
    </button>
  );
}

function ResultsScreen({
  quiz,
  answers,
  score,
  isGenerating,
  onRetry,
  onRetryWrong,
  onReview,
  onGenerateMore,
}: {
  quiz: QuizQuestion[];
  answers: AnswerRecord[];
  score: number;
  isGenerating?: boolean;
  onRetry: () => void;
  onRetryWrong: () => void;
  onReview: () => void;
  onGenerateMore: () => void;
}) {
  const percentage = Math.round((score / quiz.length) * 100);
  const isPass = percentage >= 70;
  const wrongCount = quiz.length - score;

  return (
    <>
      {isPass && <Confetti />}

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto space-y-6"
      >
        <Card className="border-border/60 shadow-xl overflow-hidden text-center">
          <div className="p-8 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent border-b border-border/40">
            <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4 text-primary">
              {isPass ? <Award className="w-8 h-8" /> : <Target className="w-8 h-8" />}
            </div>

            <h2 className="text-2xl font-display font-bold">
              {isPass ? "Outstanding Performance! 🎉" : "Keep practicing! 💪"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              You've completed the knowledge check.
            </p>

            <div className="text-6xl font-extrabold font-display my-6 text-foreground">
              {percentage}%
            </div>

            <p className="text-sm font-medium text-muted-foreground">
              {score} correct out of {quiz.length} questions
            </p>
          </div>

          <CardContent className="p-6 space-y-6">
            {/* Stats breakdown */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{score}</div>
                <div className="text-xs text-muted-foreground mt-0.5">Correct</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                <XCircle className="w-5 h-5 text-red-500 mx-auto mb-1" />
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">{wrongCount}</div>
                <div className="text-xs text-muted-foreground mt-0.5">Wrong</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-primary/10 border border-primary/20">
                <TrendingUp className="w-5 h-5 text-primary mx-auto mb-1" />
                <div className="text-2xl font-bold text-primary">{percentage}%</div>
                <div className="text-xs text-muted-foreground mt-0.5">Accuracy</div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button onClick={onReview} variant="outline" className="gap-2">
                <Eye className="w-4 h-4" /> Review Answers
              </Button>
              {wrongCount > 0 && (
                <Button onClick={onRetryWrong} variant="outline" className="gap-2 border-red-500/30 hover:bg-red-500/5 hover:text-red-600 dark:hover:text-red-400">
                  <Target className="w-4 h-4" /> Retry Wrong ({wrongCount})
                </Button>
              )}
              <Button onClick={onRetry} variant="outline" className="gap-2">
                <RotateCcw className="w-4 h-4" /> Try Again
              </Button>
              <Button onClick={onGenerateMore} disabled={isGenerating} className="gap-2">
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Generate More
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
}

function ReviewScreen({
  quiz,
  answers,
  onBack,
}: {
  quiz: QuizQuestion[];
  answers: AnswerRecord[];
  onBack: () => void;
}) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const answerMap = useMemo(() => {
    const m: Record<number, AnswerRecord> = {};
    answers.forEach((a) => { m[a.questionIndex] = a; });
    return m;
  }, [answers]);

  const letters = ["A", "B", "C", "D", "E"];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-display font-semibold">Answer Review</h3>
        <Button variant="outline" size="sm" onClick={onBack} className="gap-2">
          <TrendingUp className="w-4 h-4" /> Back to Results
        </Button>
      </div>

      {quiz.map((q, idx) => {
        const record = answerMap[idx];
        const isCorrect = record?.isCorrect ?? false;
        const isExpanded = expandedIdx === idx;

        return (
          <Card
            key={idx}
            className={cn(
              "border-border/60 overflow-hidden transition-all",
              isCorrect ? "border-emerald-500/30" : "border-red-500/30"
            )}
          >
            <div
              onClick={() => setExpandedIdx(isExpanded ? null : idx)}
              className="p-5 flex items-start gap-4 cursor-pointer hover:bg-muted/30 transition-colors"
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                  isCorrect ? "bg-emerald-500/15" : "bg-red-500/15"
                )}
              >
                {isCorrect ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-base leading-snug pr-8">
                  <span className="text-muted-foreground font-mono text-sm mr-2">Q{idx + 1}.</span>
                  {q.question}
                </p>
                {!isCorrect && record && (
                  <p className="text-sm text-red-500 dark:text-red-400 mt-1">
                    Your answer: {letters[record.selectedOption] ?? "?"} — {q.options[record.selectedOption]}
                  </p>
                )}
                <p className={cn("text-sm mt-1", isCorrect ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}>
                  Correct: {letters[q.correctIndex ?? 0]} — {q.options[q.correctIndex ?? 0]}
                </p>
              </div>
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
              )}
            </div>
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="px-5 pb-5 border-t border-border/50 pt-4">
                    <div className="flex items-start gap-2 text-sm text-foreground/80 bg-primary/5 border border-primary/20 rounded-lg p-3">
                      <BrainCircuit className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-primary">Explanation: </span>
                        {q.explanation}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        );
      })}

      <div className="flex justify-center pt-4">
        <Button onClick={onBack} className="gap-2">
          <TrendingUp className="w-4 h-4" /> Back to Results
        </Button>
      </div>
    </motion.div>
  );
}

export function QuizModule({
  workspace,
  onGenerateMore,
}: {
  workspace: LearningWorkspace;
  onGenerateMore?: () => void;
}) {
  const { animationsEnabled, currentSessionId, saveQuizResult, updateSessionWorkspace } = useWorkspaceStore();
  const [view, setView] = useState<QuizView>("quiz");
  const [activeQuiz, setActiveQuiz] = useState<QuizQuestion[]>(workspace.quiz ?? []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [score, setScore] = useState(0);
  const [isGeneratingMore, setIsGeneratingMore] = useState(false);

  React.useEffect(() => {
    setActiveQuiz(workspace.quiz ?? []);
    setCurrentIndex(0);
    setSelectedOption(null);
    setShowFeedback(false);
    setScore(0);
    setAnswers([]);
    setView("quiz");
  }, [workspace.quiz]);

  const handleGenerateMoreInternal = useCallback(async () => {
    if (onGenerateMore) {
      onGenerateMore();
      return;
    }

    setIsGeneratingMore(true);
    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: workspace.title }),
      });
      const data = await res.json();
      if (Array.isArray(data?.quiz) && data.quiz.length > 0) {
        // Save the updated quiz to IndexedDB cache!
        await setCachedModule(workspace.title, "quiz", { quiz: data.quiz });

        setActiveQuiz(data.quiz);
        setCurrentIndex(0);
        setSelectedOption(null);
        setShowFeedback(false);
        setScore(0);
        setAnswers([]);
        setView("quiz");

        if (currentSessionId) {
          updateSessionWorkspace(currentSessionId, { quiz: data.quiz });
        }
      }
    } catch (e) {
      console.error("Failed to generate more quiz questions:", e);
    } finally {
      setIsGeneratingMore(false);
    }
  }, [workspace.title, workspace.quiz, currentSessionId, updateSessionWorkspace, onGenerateMore]);

  const question = activeQuiz[currentIndex];
  const progress = activeQuiz.length > 0 ? (currentIndex / activeQuiz.length) * 100 : 0;

  // Guard: quiz data not yet available
  if (!activeQuiz.length || !question) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Target className="w-10 h-10 mx-auto mb-3 opacity-40 animate-pulse" />
        <p className="text-sm animate-pulse">Loading quiz questions...</p>
        <div className="mt-4 space-y-3 max-w-md mx-auto">
          <div className="h-16 bg-muted/50 rounded-xl animate-pulse" />
          <div className="h-10 bg-muted/30 rounded-lg animate-pulse" />
          <div className="h-10 bg-muted/30 rounded-lg animate-pulse" />
          <div className="h-10 bg-muted/30 rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  const handleSelect = useCallback((index: number) => {
    if (showFeedback) return;
    setSelectedOption(index);
    setShowFeedback(true);
    const isCorrect = index === (question.correctIndex ?? 0);
    if (isCorrect) setScore((s) => s + 1);
    setAnswers((prev) => [
      ...prev,
      { questionIndex: currentIndex, selectedOption: index, isCorrect },
    ]);
  }, [showFeedback, question, currentIndex]);

  const handleNext = useCallback(() => {
    if (currentIndex < activeQuiz.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSelectedOption(null);
      setShowFeedback(false);
    } else {
      // Quiz done — save result
      const total = activeQuiz.length;
      if (currentSessionId) {
        saveQuizResult(currentSessionId, {
          score: answers.filter((a) => a.isCorrect).length + (selectedOption === (question.correctIndex ?? 0) && showFeedback ? 1 : 0),
          total,
          accuracy: Math.round(((answers.filter((a) => a.isCorrect).length + (selectedOption !== null && selectedOption === (question.correctIndex ?? 0) ? 1 : 0)) / total) * 100),
          completedAt: Date.now(),
        });
      }
      setView("results");
    }
  }, [currentIndex, activeQuiz.length, score, selectedOption, question, answers, currentSessionId, saveQuizResult, showFeedback]);

  const handleRetry = useCallback(() => {
    setActiveQuiz(workspace.quiz);
    setCurrentIndex(0);
    setSelectedOption(null);
    setShowFeedback(false);
    setScore(0);
    setAnswers([]);
    setView("quiz");
  }, [workspace.quiz]);

  const handleRetryWrong = useCallback(() => {
    const wrongIndices = answers.filter((a) => !a.isCorrect).map((a) => a.questionIndex);
    const wrongQuestions = wrongIndices
      .map((i) => activeQuiz[i])
      .filter(Boolean) as QuizQuestion[];
    if (wrongQuestions.length === 0) return;
    setActiveQuiz(wrongQuestions);
    setCurrentIndex(0);
    setSelectedOption(null);
    setShowFeedback(false);
    setScore(0);
    setAnswers([]);
    setView("quiz");
  }, [answers, activeQuiz]);

  const computedScore = useMemo(() => {
    return answers.filter((a) => a.isCorrect).length;
  }, [answers]);

  if (view === "results") {
    return (
      <ResultsScreen
        quiz={activeQuiz}
        answers={answers}
        score={computedScore}
        isGenerating={isGeneratingMore}
        onRetry={handleRetry}
        onRetryWrong={handleRetryWrong}
        onReview={() => setView("review")}
        onGenerateMore={handleGenerateMoreInternal}
      />
    );
  }

  if (view === "review") {
    return (
      <ReviewScreen
        quiz={activeQuiz}
        answers={answers}
        onBack={() => setView("results")}
      />
    );
  }

  const optionLetters = ["A", "B", "C", "D", "E"];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-semibold flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Knowledge Check
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {activeQuiz.length} question{activeQuiz.length !== 1 ? "s" : ""}
          </p>
        </div>
        <span className="font-mono text-sm text-muted-foreground bg-secondary px-3 py-1 rounded-full">
          {currentIndex + 1} / {activeQuiz.length}
        </span>
      </div>

      <Progress value={progress} className="h-2" />

      <div>
        <motion.div
          key={currentIndex}
          initial={animationsEnabled ? { opacity: 0 } : undefined}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <Card className="border-border/50 shadow-md overflow-hidden">
            <CardContent className="p-6 md:p-8 space-y-6">
              <div className="flex items-start gap-3">
                <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold text-sm flex items-center justify-center shrink-0 mt-0.5">
                  {currentIndex + 1}
                </span>
                <h3 className="text-xl md:text-2xl font-medium leading-relaxed flex-1">
                  {question?.question}
                </h3>
              </div>

              <div className="space-y-3">
                {question?.options?.map((option, idx) => (
                  <OptionButton
                    key={idx}
                    label={optionLetters[idx]}
                    option={option}
                    index={idx}
                    selectedOption={selectedOption}
                    showFeedback={showFeedback}
                    correctIndex={question.correctIndex ?? 0}
                    onClick={() => handleSelect(idx)}
                  />
                ))}
              </div>

              <AnimatePresence>
                {showFeedback && (
                  <motion.div
                    initial={animationsEnabled ? { opacity: 0, height: 0 } : undefined}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={animationsEnabled ? { opacity: 0, height: 0 } : undefined}
                    transition={{ duration: 0.25 }}
                    className="pt-4 border-t border-border/50"
                  >
                    <div
                      className={cn(
                        "p-4 rounded-xl flex items-start gap-3 mb-4",
                        selectedOption === (question.correctIndex ?? 0)
                          ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300"
                          : "bg-primary/8 border border-primary/20 text-foreground"
                      )}
                    >
                      <div className="mt-0.5 shrink-0">
                        {selectedOption === (question.correctIndex ?? 0) ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <BrainCircuit className="w-5 h-5 text-primary" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold mb-1">
                          {selectedOption === (question.correctIndex ?? 0)
                            ? "Correct! ✨"
                            : "Explanation"}
                        </p>
                        <p className="opacity-90 leading-relaxed">{question.explanation}</p>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button onClick={handleNext} size="lg" className="px-8 rounded-full">
                        {currentIndex === activeQuiz.length - 1
                          ? "View Results"
                          : "Next Question →"}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
