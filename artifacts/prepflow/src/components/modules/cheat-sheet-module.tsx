import React, { useState } from "react";
import { LearningWorkspace } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWorkspaceStore } from "@/lib/workspace-store";
import { getFallbackCheatSheet } from "@/lib/fallback-generators";
import { motion } from "framer-motion";
import { FileText, Copy, Check, Sparkles } from "lucide-react";

export function CheatSheetModule({ workspace }: { workspace: LearningWorkspace }) {
  const { animationsEnabled } = useWorkspaceStore();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const sections = (Array.isArray(workspace?.cheatSheet) && workspace.cheatSheet.length > 0)
    ? workspace.cheatSheet
    : getFallbackCheatSheet(workspace?.title || "Topic");

  const copyText = (text: string, key: string) => {
    try {
      navigator.clipboard.writeText(text);
    } catch {
      // Fallback
    }
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const copySection = (category: string, points: string[], idx: number) => {
    const text = `${(category || "Section").toUpperCase()}\n${(points || []).map((p) => `• ${p}`).join("\n")}`;
    copyText(text, `section-${idx}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-display font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Revision Cheat Sheet
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Concise, interview-friendly bullet points for fast revision (25+ key points)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {sections.map((section: any, idx: number) => {
          const categoryName = section?.category || section?.title || `Section ${idx + 1}`;
          const points: string[] = Array.isArray(section?.points)
            ? section.points
            : Array.isArray(section?.bullets)
            ? section.bullets
            : [];

          return (
            <motion.div
              key={idx}
              initial={animationsEnabled ? { opacity: 0, scale: 0.96 } : undefined}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.08 }}
              className="h-full"
            >
              <Card className="h-full border-border/60 hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col">
                <CardHeader className="bg-muted/40 pb-3 border-b border-border/50 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-base font-bold text-primary flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary/70" />
                    {categoryName}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copySection(categoryName, points, idx)}
                    className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                  >
                    {copiedKey === `section-${idx}` ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    {copiedKey === `section-${idx}` ? "Copied" : "Copy Section"}
                  </Button>
                </CardHeader>
                <CardContent className="pt-4 flex-1">
                  <ul className="space-y-3">
                    {points.map((point, pIdx) => {
                      const pointKey = `point-${idx}-${pIdx}`;
                      const isCopied = copiedKey === pointKey;
                      return (
                        <li
                          key={pIdx}
                          className="group flex items-start gap-3 p-2 rounded-lg hover:bg-secondary/60 transition-colors relative"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0 group-hover:scale-125 transition-transform" />
                          <span className="text-sm leading-relaxed text-foreground/90 flex-1 font-medium">
                            {point}
                          </span>
                          <button
                            onClick={() => copyText(point, pointKey)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-foreground rounded transition-opacity shrink-0"
                            title="Copy point"
                          >
                            {isCopied ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
