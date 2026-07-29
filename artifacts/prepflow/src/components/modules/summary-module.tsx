import React, { useState } from "react";
import { LearningWorkspace } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check, ChevronDown, ChevronUp, AlignLeft } from "lucide-react";
import { useWorkspaceStore } from "@/lib/workspace-store";
import { getFallbackSummary } from "@/lib/fallback-generators";
import { motion, AnimatePresence } from "framer-motion";

export function SummaryModule({ workspace }: { workspace: LearningWorkspace }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const { animationsEnabled } = useWorkspaceStore();

  const summaryText = (workspace?.summary && workspace.summary.length > 200)
    ? workspace.summary
    : getFallbackSummary(workspace?.title || "Topic");

  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(summaryText);
    } catch {
      // Fallback
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isLong = summaryText.length > 400;

  return (
    <motion.div
      initial={animationsEnabled ? { opacity: 0, y: 10 } : undefined}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-display font-semibold flex items-center gap-2">
          <AlignLeft className="w-5 h-5 text-primary" />
          Executive Summary
        </h2>
        <Button variant="ghost" size="sm" onClick={handleCopy} className="gap-2">
          {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          {copied ? "Copied" : "Copy text"}
        </Button>
      </div>

      <Card className="overflow-hidden border-primary/10 bg-primary/5">
        <CardContent className="p-6">
          <div className="relative">
            <AnimatePresence initial={false}>
              <motion.div
                key="content"
                initial={false}
                animate={{
                  height: expanded || !isLong ? "auto" : "120px",
                }}
                className="overflow-hidden text-foreground/90 leading-relaxed whitespace-pre-wrap text-lg"
              >
                {summaryText}
              </motion.div>
            </AnimatePresence>
            
            {!expanded && isLong && (
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-card to-transparent flex items-end justify-center pointer-events-none" />
            )}
          </div>

          {isLong && (
            <div className="mt-4 flex justify-center">
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => setExpanded(!expanded)}
                className="rounded-full gap-2 px-6"
              >
                {expanded ? (
                  <>Show Less <ChevronUp className="w-4 h-4" /></>
                ) : (
                  <>Read Full Summary <ChevronDown className="w-4 h-4" /></>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
