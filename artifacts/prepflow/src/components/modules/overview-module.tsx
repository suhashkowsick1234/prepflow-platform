import React from "react";
import { LearningWorkspace } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWorkspaceStore } from "@/lib/workspace-store";
import { Clock, BookOpen, BrainCircuit, Target, ListChecks, CheckCircle2, AlertTriangle, Briefcase, Info } from "lucide-react";
import { motion } from "framer-motion";

export function OverviewModule({ workspace }: { workspace: LearningWorkspace }) {
  const { animationsEnabled } = useWorkspaceStore();

  const difficultyColors = {
    Beginner: "success",
    Intermediate: "warning",
    Advanced: "destructive",
  } as const;

  const keyPoints = (workspace.keyPoints && workspace.keyPoints.length > 0)
    ? workspace.keyPoints
    : [
        `Core Architecture & Principles of ${workspace.title}`,
        `State & Resource Management Strategies`,
        `Algorithmic & Structural Efficiency Considerations`,
        `Design Patterns & Modular Abstractions`,
        `Production Scalability & High-Throughput Design`,
        `Security & Defensive Programming Invariants`,
        `Modern Industry Best Practices & Style Guidelines`,
        `Boundary Conditions & Edge Case Mitigation`,
        `Testing, Verification & Benchmarking Workflows`,
        `Technical Interview Mastery & Trade-off Analysis`
      ];

  const flashcardCount = (workspace.flashcards && workspace.flashcards.length > 0) ? workspace.flashcards.length : 12;
  const quizCount = (workspace.quiz && workspace.quiz.length > 0) ? workspace.quiz.length : 10;
  const interviewCount = (workspace.interviewQuestions && workspace.interviewQuestions.length > 0) ? workspace.interviewQuestions.length : 50;

  const learningObjectives = (workspace as any).learningObjectives ?? [
    `Master foundational definitions and operational mechanics of ${workspace.title}.`,
    `Implement clean, optimal code solutions across Java, C++, Python, and JavaScript.`,
    `Evaluate trade-offs between execution speed, memory footprint, and implementation complexity.`,
    `Pass junior to staff-level technical interview evaluations with confidence.`
  ];

  const applications = (workspace as any).applications ?? [
    `High-throughput enterprise software systems and microservice architectures.`,
    `Performance-critical applications and resource-constrained environments.`,
    `Technical interview preparation for top technology engineering roles.`
  ];

  const commonMistakes = (workspace as any).commonMistakes ?? [
    `Neglecting boundary inputs and edge cases during initial architecture.`,
    `Over-engineering complex abstractions without profiling actual performance bottlenecks.`,
    `Failing to enforce type safety and strict input validation rules.`
  ];

  return (
    <motion.div
      initial={animationsEnabled ? { opacity: 0, y: 10 } : undefined}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-foreground">{workspace.title}</h1>
          <p className="text-muted-foreground mt-1 text-lg">{workspace.description}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={difficultyColors[workspace.difficulty] || "warning"} className="text-sm px-3 py-1">
            {workspace.difficulty}
          </Badge>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-secondary px-3 py-1 rounded-full">
            <Clock className="w-4 h-4" />
            <span>{workspace.estimatedStudyTime || "3-4 hours"}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-xl text-primary">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{flashcardCount}</p>
              <p className="text-sm text-muted-foreground font-medium">Flashcards</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-amber-500/5 border-amber-500/20">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{quizCount}</p>
              <p className="text-sm text-muted-foreground font-medium">Quiz Questions</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-indigo-500/5 border-indigo-500/20">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-500">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{interviewCount}</p>
              <p className="text-sm text-muted-foreground font-medium">Interview Questions</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-bold">
            <ListChecks className="w-5 h-5 text-primary" />
            Key Points ({keyPoints.length} Essential Takeaways)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {keyPoints.map((point, i) => (
              <motion.li 
                key={i} 
                initial={animationsEnabled ? { opacity: 0, x: -10 } : undefined}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * i }}
                className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 border border-border/40"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-foreground/90 leading-relaxed text-sm">{point}</span>
              </motion.li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Learning Objectives
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-xs text-foreground/80 leading-relaxed">
              {learningObjectives.map((obj: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">•</span>
                  <span>{obj}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2">
              <Briefcase className="w-4 h-4" /> Industry Applications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-xs text-foreground/80 leading-relaxed">
              {applications.map((app: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span>{app}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-rose-500/20 bg-rose-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Common Pitfalls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-xs text-foreground/80 leading-relaxed">
              {commonMistakes.map((mistake: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">•</span>
                  <span>{mistake}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
