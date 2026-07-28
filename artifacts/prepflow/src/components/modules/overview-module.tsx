import React, { useState, useEffect } from "react";
import { LearningWorkspace } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useWorkspaceStore } from "@/lib/workspace-store";
import { Clock, BookOpen, BrainCircuit, Target, ListChecks } from "lucide-react";
import { motion } from "framer-motion";

export function OverviewModule({ workspace }: { workspace: LearningWorkspace }) {
  const { animationsEnabled } = useWorkspaceStore();

  const difficultyColors = {
    Beginner: "success",
    Intermediate: "warning",
    Advanced: "destructive",
  } as const;

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
          <Badge variant={difficultyColors[workspace.difficulty]} className="text-sm px-3 py-1">
            {workspace.difficulty}
          </Badge>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-secondary px-3 py-1 rounded-full">
            <Clock className="w-4 h-4" />
            <span>{workspace.estimatedStudyTime}</span>
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
            <p className="text-2xl font-bold text-foreground">{workspace.flashcards?.length ?? 0}</p>
              <p className="text-sm text-muted-foreground font-medium">Flashcards</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-accent/5 border-accent/20">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-accent/10 rounded-xl text-accent-foreground">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{workspace.quiz?.length ?? 0}</p>
              <p className="text-sm text-muted-foreground font-medium">Quiz Questions</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-secondary/40 border-border">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-secondary rounded-xl text-foreground">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{workspace.interviewQuestions?.length ?? 0}</p>
              <p className="text-sm text-muted-foreground font-medium">Interview Q's</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-primary" />
            Key Points
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {(workspace.keyPoints ?? []).map((point, i) => (
              <motion.li 
                key={i} 
                initial={animationsEnabled ? { opacity: 0, x: -10 } : undefined}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * i }}
                className="flex items-start gap-3"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                <span className="text-foreground/90 leading-relaxed">{point}</span>
              </motion.li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </motion.div>
  );
}
