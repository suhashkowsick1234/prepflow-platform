import React, { useState, useEffect } from "react";
import { LearningWorkspace } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code2, Copy, Check, FileText, Loader2, Sparkles, Clock, HardDrive, AlertTriangle } from "lucide-react";
import { useWorkspaceStore } from "@/lib/workspace-store";
import { setCachedModule } from "@/lib/module-cache";
import { safeFetchJson } from "@/lib/safe-fetch";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type ApproachKey = "optimalApproach" | "betterApproach" | "bruteForce";

const LANGUAGES = ["JavaScript", "Python", "Java", "C++"] as const;
type Language = typeof LANGUAGES[number];

const LANG_CLASS: Record<Language, string> = {
  JavaScript: "language-javascript",
  Python: "language-python",
  Java: "language-java",
  "C++": "language-cpp",
};

function resolveApproachData(codeData: any, approach: ApproachKey) {
  if (!codeData || typeof codeData !== "object") return null;

  if (codeData[approach] && typeof codeData[approach] === "object") {
    return codeData[approach];
  }

  if (
    approach === "optimalApproach" &&
    Array.isArray(codeData.examples) &&
    codeData.examples.length > 0
  ) {
    return {
      explanation: codeData.description ?? "Implementation and analysis.",
      timeComplexity: "O(N)",
      spaceComplexity: "O(1)",
      examples: codeData.examples,
    };
  }

  return null;
}

function findExample(examples: any[], lang: Language): any | null {
  if (!Array.isArray(examples)) return null;
  return (
    examples.find((e) => {
      if (!e || typeof e !== "object") return false;
      const langStr = e.language;
      if (!langStr || typeof langStr !== "string") return false;
      return langStr.toLowerCase() === lang.toLowerCase();
    }) ?? null
  );
}

export function CodeExamplesModule({ workspace }: { workspace: LearningWorkspace }) {
  const { animationsEnabled, currentSessionId, updateSessionWorkspace } = useWorkspaceStore();
  const [copiedLanguage, setCopiedLanguage] = useState<string | null>(null);
  const [selectedApproach, setSelectedApproach] = useState<ApproachKey>("optimalApproach");
  const [selectedLanguage, setSelectedLanguage] = useState<Language>("JavaScript");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const codeData: any = workspace?.codeExample && typeof workspace.codeExample === "object"
    ? workspace.codeExample
    : {};

  useEffect(() => {
    if (!document.getElementById("prism-css")) {
      const link = document.createElement("link");
      link.id = "prism-css";
      link.rel = "stylesheet";
      link.href = "https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css";
      document.head.appendChild(link);
    }
    if (!document.getElementById("prism-js")) {
      const script = document.createElement("script");
      script.id = "prism-js";
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js";
      script.async = true;
      document.body.appendChild(script);

      const autoloader = document.createElement("script");
      autoloader.id = "prism-autoloader";
      autoloader.src = "https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/plugins/autoloader/prism-autoloader.min.js";
      autoloader.async = true;
      document.body.appendChild(autoloader);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        if ((window as any).Prism) {
          (window as any).Prism.highlightAll();
        }
      } catch {
        // non-fatal
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [selectedApproach, selectedLanguage, isGenerating]);

  const handleCopy = (code: string, lang: string) => {
    try {
      navigator.clipboard.writeText(code);
    } catch {
      const el = document.createElement("textarea");
      el.value = code;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopiedLanguage(lang);
    setTimeout(() => setCopiedLanguage(null), 2000);
  };

  const approachData = resolveApproachData(codeData, selectedApproach);

  const handleGenerateApproach = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    setGenerateError(null);

    try {
      const result = await safeFetchJson("/api/code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: workspace?.title ?? "",
          approach: selectedApproach,
        }),
      });

      if (!result.ok) {
        setGenerateError(result.error ?? "Failed to generate code example.");
        setIsGenerating(false);
        return;
      }

      const returnedExample = result.data?.codeExample;

      if (returnedExample && typeof returnedExample === "object") {
        const updatedCodeExample = {
          ...codeData,
          isProgramming: true,
          problemStatement: returnedExample.problemStatement ?? codeData.problemStatement,
          description: returnedExample.description ?? codeData.description,
          [selectedApproach]: returnedExample[selectedApproach] ?? returnedExample.optimalApproach ?? returnedExample,
        };

        if (currentSessionId) {
          updateSessionWorkspace(currentSessionId, { codeExample: updatedCodeExample });
        }

        if (workspace?.title) {
          await setCachedModule(workspace.title, "code", { codeExample: updatedCodeExample });
        }
      }
    } catch (e: any) {
      console.error("Failed to generate approach code:", e);
      setGenerateError("Network timeout. Retrying...");
    } finally {
      setIsGenerating(false);
    }
  };

  const approachOptions = [
    { id: "optimalApproach" as const, label: "Optimal Approach", badge: "Best" },
    { id: "betterApproach" as const, label: "Better Approach", badge: "Optimized" },
    { id: "bruteForce" as const, label: "Brute Force", badge: "Naive" },
  ];

  const approachLabel =
    selectedApproach === "bruteForce"
      ? "Brute Force"
      : selectedApproach === "betterApproach"
      ? "Better"
      : "Optimal";

  return (
    <motion.div
      initial={animationsEnabled ? { opacity: 0, y: 10 } : undefined}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-4xl mx-auto"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Code2 className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-display font-semibold">Coding Implementation &amp; Analysis</h2>
        </div>
      </div>

      {codeData.description && (
        <p className="text-muted-foreground leading-relaxed">{codeData.description}</p>
      )}

      {codeData.problemStatement && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-primary flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" /> Problem Statement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground/90 leading-relaxed text-sm">{codeData.problemStatement}</p>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-2 border-b border-border/50 pb-3 overflow-x-auto no-scrollbar">
        {approachOptions.map((opt) => (
          <button
            key={opt.id}
            onClick={() => setSelectedApproach(opt.id)}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border flex items-center gap-2",
              selectedApproach === opt.id
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-secondary/60 hover:bg-secondary border-border/50 text-muted-foreground hover:text-foreground"
            )}
          >
            {opt.label}
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] px-1.5 py-0 h-4 uppercase font-bold",
                selectedApproach === opt.id
                  ? "bg-primary-foreground/10 text-primary-foreground border-primary-foreground/20"
                  : "bg-muted text-muted-foreground border-border/50"
              )}
            >
              {opt.badge}
            </Badge>
          </button>
        ))}
      </div>

      {isGenerating ? (
        <Card className="p-12 text-center border-border/50 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">
            Generating {approachLabel} approach implementations...
          </p>
        </Card>
      ) : approachData ? (
        <div className="space-y-6">
          <Card className="border-border/60">
            <CardContent className="p-5 space-y-4">
              <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="w-4 h-4 text-primary" />
                  Time Complexity:{" "}
                  <strong className="text-foreground">{approachData.timeComplexity ?? "O(N)"}</strong>
                </span>
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <HardDrive className="w-4 h-4 text-primary" />
                  Space Complexity:{" "}
                  <strong className="text-foreground">{approachData.spaceComplexity ?? "O(1)"}</strong>
                </span>
              </div>
              {approachData.explanation && (
                <p className="text-sm text-foreground/90 leading-relaxed">{approachData.explanation}</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60 overflow-hidden shadow-md">
            <Tabs
              value={selectedLanguage}
              onValueChange={(v) => setSelectedLanguage(v as Language)}
              className="w-full"
            >
              <div className="bg-muted px-4 py-2 border-b border-border/60 flex justify-between items-center">
                <TabsList className="bg-transparent h-auto p-0 gap-1">
                  {LANGUAGES.map((lang) => (
                    <TabsTrigger
                      key={lang}
                      value={lang}
                      className="data-[state=active]:bg-card rounded-t-lg rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary px-4 py-2 text-xs font-semibold"
                    >
                      {lang}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {LANGUAGES.map((lang) => {
                const ex = findExample(approachData?.examples, lang);
                return (
                  <TabsContent key={lang} value={lang} className="m-0 border-none outline-none">
                    <div className="relative group">
                      {ex && ex.code ? (
                        <>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleCopy(ex.code, lang)}
                            className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-10 h-8 gap-1.5 text-xs"
                          >
                            {copiedLanguage === lang ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                            {copiedLanguage === lang ? "Copied!" : "Copy Code"}
                          </Button>
                          <div className="bg-[#1d1f21] p-4 m-0 overflow-x-auto text-sm font-mono leading-relaxed">
                            <pre className="!m-0 !bg-transparent">
                              <code className={LANG_CLASS[lang]}>{ex.code}</code>
                            </pre>
                          </div>
                          {ex.explanation && (
                            <div className="bg-muted/30 p-4 border-t border-border/50 text-xs text-foreground/80 leading-relaxed font-sans">
                              <span className="font-semibold text-primary">Explanation: </span>
                              {ex.explanation}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="p-8 text-center text-sm text-muted-foreground">
                          No {lang} implementation available for this approach.
                        </div>
                      )}
                    </div>
                  </TabsContent>
                );
              })}
            </Tabs>
          </Card>
        </div>
      ) : (
        <Card className="p-12 text-center border-border/50 flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-semibold text-base">Generate Coding Approach</h4>
            <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
              The {approachLabel} approach code has not been generated yet. Click below to load it on demand.
            </p>
          </div>
          {generateError && (
            <div className="flex items-center gap-2 text-sm text-rose-500 bg-rose-500/10 px-4 py-2 rounded-lg border border-rose-500/20">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {generateError}
            </div>
          )}
          <Button onClick={handleGenerateApproach} disabled={isGenerating} className="gap-2">
            <Sparkles className="w-4 h-4" />
            Generate Code &amp; Explanations
          </Button>
        </Card>
      )}
    </motion.div>
  );
}
