import React from "react";
import { LearningWorkspace } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { useWorkspaceStore } from "@/lib/workspace-store";
import { motion } from "framer-motion";
import { Link2 } from "lucide-react";

export function RelatedTopicsModule({ 
  workspace, 
  onTopicSelect 
}: { 
  workspace: LearningWorkspace;
  onTopicSelect: (topic: string) => void;
}) {
  const { animationsEnabled } = useWorkspaceStore();

  const topics = Array.isArray(workspace?.relatedTopics) && workspace.relatedTopics.length > 0
    ? workspace.relatedTopics
    : [
        `${workspace?.title || "Topic"} Fundamentals`,
        `Advanced ${workspace?.title || "Topic"}`,
        `${workspace?.title || "Topic"} Best Practices`,
        `System Design & Architecture`,
        `Interview & Real-world Scenarios`,
      ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <Link2 className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-display font-semibold">Keep Learning</h2>
      </div>

      <div className="flex flex-wrap gap-3">
        {topics.map((topic, idx) => (
          <motion.button
            key={idx}
            onClick={() => onTopicSelect(topic)}
            initial={animationsEnabled ? { opacity: 0, scale: 0.9 } : undefined}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            whileHover={animationsEnabled ? { scale: 1.05 } : undefined}
            whileTap={animationsEnabled ? { scale: 0.95 } : undefined}
            className="px-4 py-2.5 rounded-full bg-secondary hover:bg-primary hover:text-primary-foreground text-sm font-medium transition-colors border border-border/50 hover:border-primary shadow-sm"
          >
            {topic}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
