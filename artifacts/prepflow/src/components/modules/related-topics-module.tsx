import React from "react";
import { LearningWorkspace } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWorkspaceStore } from "@/lib/workspace-store";
import { getFallbackRelatedTopics } from "@/lib/fallback-generators";
import { motion } from "framer-motion";
import { Link2, Sparkles, BookOpen, Layers, Zap } from "lucide-react";

export function RelatedTopicsModule({ 
  workspace, 
  onTopicSelect 
}: { 
  workspace: LearningWorkspace;
  onTopicSelect: (topic: string) => void;
}) {
  const { animationsEnabled } = useWorkspaceStore();
  const currentTitle = workspace?.title || "Topic";

  const rawTopics = (Array.isArray(workspace?.relatedTopics) && workspace.relatedTopics.length >= 10)
    ? workspace.relatedTopics
    : getFallbackRelatedTopics(currentTitle);

  // Categorize 15-20 topics into Beginner (5), Intermediate (8), Advanced (7)
  const beginnerTopics = rawTopics.slice(0, 5);
  const intermediateTopics = rawTopics.slice(5, 13);
  const advancedTopics = rawTopics.slice(13);

  const groups = [
    { title: "Beginner / Foundational", badge: "Beginner", variant: "success" as const, icon: <BookOpen className="w-4 h-4 text-emerald-500" />, items: beginnerTopics },
    { title: "Intermediate / Architecture", badge: "Intermediate", variant: "warning" as const, icon: <Layers className="w-4 h-4 text-amber-500" />, items: intermediateTopics },
    { title: "Advanced / System Design", badge: "Advanced", variant: "destructive" as const, icon: <Zap className="w-4 h-4 text-rose-500" />, items: advancedTopics },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-4 border-b border-border/50 pb-4">
        <div className="flex items-center gap-2">
          <Link2 className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-display font-semibold">Explore Related Learning Workspaces</h2>
        </div>
        <Badge variant="outline" className="gap-1 text-xs">
          <Sparkles className="w-3.5 h-3.5 text-primary" /> {rawTopics.length} Related Topics
        </Badge>
      </div>

      <div className="space-y-6">
        {groups.map((group, gIdx) => (
          <Card key={gIdx} className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center justify-between">
                <span className="flex items-center gap-2">
                  {group.icon}
                  {group.title}
                </span>
                <Badge variant={group.variant} className="text-xs">
                  {group.badge}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2.5">
                {group.items.map((topic, idx) => (
                  <motion.button
                    key={idx}
                    onClick={() => onTopicSelect(topic)}
                    initial={animationsEnabled ? { opacity: 0, scale: 0.9 } : undefined}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.03 }}
                    whileHover={animationsEnabled ? { scale: 1.04 } : undefined}
                    whileTap={animationsEnabled ? { scale: 0.96 } : undefined}
                    className="px-3.5 py-2 rounded-lg bg-secondary/70 hover:bg-primary hover:text-primary-foreground text-xs font-medium transition-all border border-border/50 hover:border-primary shadow-sm flex items-center gap-1.5"
                  >
                    <span>{topic}</span>
                    <Sparkles className="w-3 h-3 opacity-60" />
                  </motion.button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
