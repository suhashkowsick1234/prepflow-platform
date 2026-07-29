import React, { useState, useEffect } from "react";
import { LearningWorkspace } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code2, Copy, Check, FileText, Loader2, Sparkles, Clock, HardDrive, AlertTriangle, Lightbulb, ListChecks, ArrowRight } from "lucide-react";
import { useWorkspaceStore } from "@/lib/workspace-store";
import { setCachedModule } from "@/lib/module-cache";
import { safeFetchJson } from "@/lib/safe-fetch";
import { getApiUrl } from "@/lib/api-config";
import { getFallbackCodeExample } from "@/lib/fallback-generators";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type ApproachKey = "optimalApproach" | "betterApproach" | "bruteForce";
const LANGUAGES = ["C++", "Java", "Python", "JavaScript"] as const;
type Language = typeof LANGUAGES[number];

const LANG_CLASS: Record<Language, string> = {
  "C++": "language-cpp",
  Java: "language-java",
  Python: "language-python",
  JavaScript: "language-javascript",
};

function CodeViewerWithLineNumbers({
  code,
  language,
  onCopy,
  copied,
}: {
  code: string;
  language: Language;
  onCopy: () => void;
  copied: boolean;
}) {
  const lines = code.trim().split("\n");

  return (
    <div className="relative group border border-border/60 rounded-xl overflow-hidden shadow-lg bg-[#1e1e1e]">
      {/* Top Header Bar */}
      <div className="bg-[#181818] px-4 py-2.5 border-b border-[#2d2d2d] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-rose-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
          </div>
          <span className="text-xs font-mono font-medium text-muted-foreground ml-2">
            solution.{language === "C++" ? "cpp" : language === "Java" ? "java" : language === "Python" ? "py" : "js"}
          </span>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={onCopy}
          className="h-7 text-xs gap-1.5 bg-[#2d2d2d] hover:bg-[#3d3d3d] text-foreground border border-[#404040]"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied Code" : "Copy Code"}
        </Button>
      </div>

      {/* Code Area with Line Numbers */}
      <div className="flex font-mono text-sm leading-relaxed overflow-x-auto">
        {/* Line Numbers Gutter */}
        <div className="py-4 px-3 bg-[#161616] border-r border-[#2d2d2d] select-none text-right text-xs text-[#5c6370] font-mono flex flex-col shrink-0 min-w-[44px]">
          {lines.map((_, i) => (
            <span key={i} className="h-6 leading-6">
              {i + 1}
            </span>
          ))}
        </div>

        {/* Highlighted Code Output */}
        <div className="py-4 px-4 overflow-x-auto flex-1 text-[#abb2bf] bg-[#1e1e1e]">
          <pre className="!m-0 !p-0 !bg-transparent font-mono text-sm leading-6">
            <code className={LANG_CLASS[language]}>{code.trim()}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}

export function CodeExamplesModule({ workspace }: { workspace: LearningWorkspace }) {
  const { animationsEnabled, currentSessionId, updateSessionWorkspace } = useWorkspaceStore();
  const [copiedLanguage, setCopiedLanguage] = useState<string | null>(null);
  const [selectedApproach, setSelectedApproach] = useState<ApproachKey>("optimalApproach");
  const [selectedLanguage, setSelectedLanguage] = useState<Language>("C++");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // Fallback generator ensures distinct implementations for each approach
  const fallbackCodeObj = getFallbackCodeExample(workspace?.title || "Topic", selectedApproach);
  const codeData: any = (workspace?.codeExample && typeof workspace.codeExample === "object" && Object.keys(workspace.codeExample).length > 1)
    ? workspace.codeExample
    : fallbackCodeObj.codeExample || fallbackCodeObj;

  // Inject custom Prism styles for colored comments (#6A9955), keywords (#569CD6), strings (#CE9178), etc.
  useEffect(() => {
    if (!document.getElementById("prism-css-theme")) {
      const style = document.createElement("style");
      style.id = "prism-css-theme";
      style.innerHTML = `
        .token.comment, .token.block-comment, .token.prolog, .token.doctype, .token.cdata { color: #6A9955 !important; font-style: italic; }
        .token.keyword, .token.property, .token.tag, .token.boolean, .token.number, .token.constant, .token.symbol, .token.deleted { color: #569CD6 !important; font-weight: 600; }
        .token.string, .token.char, .token.builtin, .token.inserted { color: #CE9178 !important; }
        .token.operator, .token.entity, .token.url, .language-css .token.string, .style .token.string { color: #D4D4D4 !important; }
        .token.function, .token.class-name { color: #DCDCAA !important; }
        .token.variable { color: #9CDCFE !important; }
      `;
      document.head.appendChild(style);
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

  // Trigger syntax highlighting on tab or approach change
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        if ((window as any).Prism) {
          (window as any).Prism.highlightAll();
        }
      } catch {
        // non-fatal
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [selectedApproach, selectedLanguage, isGenerating]);

  const handleCopyCode = (code: string, lang: string) => {
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

  // Get current approach object (Optimal, Better, or Brute Force)
  const currentApproachData = codeData[selectedApproach] || fallbackCodeObj[selectedApproach] || fallbackCodeObj.optimalApproach;

  const approachOptions = [
    { id: "optimalApproach" as const, label: "Optimal Approach", badge: "O(N)", color: "border-emerald-500/40 text-emerald-500" },
    { id: "betterApproach" as const, label: "Better Approach", badge: "O(N log N)", color: "border-amber-500/40 text-amber-500" },
    { id: "bruteForce" as const, label: "Brute Force", badge: "O(N²)", color: "border-rose-500/40 text-rose-500" },
  ];

  // Extract language specific code for selected language
  const examplesList = Array.isArray(currentApproachData?.examples) ? currentApproachData.examples : [];
  const currentExample = examplesList.find((e: any) => (e?.language || "").toLowerCase() === selectedLanguage.toLowerCase()) || {
    language: selectedLanguage,
    code: `// Implementation for ${selectedLanguage}\n// See algorithm explanation below.`,
    explanation: currentApproachData?.explanation ?? "Algorithmic implementation."
  };

  const algorithmPoints: string[] = Array.isArray(currentApproachData?.algorithmExplanation)
    ? currentApproachData.algorithmExplanation
    : [
        `Validates input boundary conditions before processing elements.`,
        `Uses domain-specific data structures to maintain state and optimize lookups.`,
        `Monotonically reduces the remaining search space during execution.`,
        `Handles zero, negative values, and duplicate elements seamlessly.`,
        `Ensures clean separation between input reading and output formatting.`,
        `Prevents unexpected runtime exceptions via defensive programming.`
      ];

  const interviewTips: string[] = Array.isArray(currentApproachData?.interviewTips)
    ? currentApproachData.interviewTips
    : [
        `State the brute-force baseline first before diving into optimal code.`,
        `Walk through space-time trade-offs out loud with the interviewer.`,
        `Mention potential edge cases (null inputs, duplicate values, extreme bounds).`
      ];

  return (
    <motion.div
      initial={animationsEnabled ? { opacity: 0, y: 10 } : undefined}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-4xl mx-auto"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Code2 className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-display font-semibold">Competitive Coding &amp; Technical Analysis</h2>
        </div>
      </div>

      {/* Problem Statement Card */}
      {codeData.problemStatement && (
        <Card className="border-primary/20 bg-primary/5 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-primary flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" /> Problem Statement &amp; Constraints
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground/90 leading-relaxed text-sm whitespace-pre-wrap font-sans">{codeData.problemStatement}</p>
          </CardContent>
        </Card>
      )}

      {/* Approach Tabs Selector */}
      <div className="flex items-center gap-2 border-b border-border/50 pb-3 overflow-x-auto no-scrollbar">
        {approachOptions.map((opt) => (
          <button
            key={opt.id}
            onClick={() => setSelectedApproach(opt.id)}
            className={cn(
              "px-4 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border flex items-center gap-2",
              selectedApproach === opt.id
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-secondary/60 hover:bg-secondary border-border/50 text-muted-foreground hover:text-foreground"
            )}
          >
            <span>{opt.label}</span>
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] px-1.5 py-0 h-4 font-mono font-bold uppercase",
                selectedApproach === opt.id
                  ? "bg-primary-foreground/15 text-primary-foreground border-primary-foreground/30"
                  : "bg-muted text-muted-foreground border-border/50"
              )}
            >
              {opt.badge}
            </Badge>
          </button>
        ))}
      </div>

      {/* Algorithm Explanation Section */}
      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-primary" /> Algorithm Explanation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs text-foreground/90">
            {algorithmPoints.map((pt, i) => (
              <li key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-secondary/30 border border-border/40">
                <ArrowRight className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                <span className="leading-relaxed font-sans">{pt}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Complexity Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> Time Complexity
              </span>
              <Badge variant="outline" className="font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                {currentApproachData?.timeComplexity || "O(N)"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <p className="text-xs text-foreground/80 leading-relaxed font-sans">
              {currentApproachData?.timeExplanation || "Time complexity analysis based on execution iteration count."}
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-bold text-blue-600 dark:text-blue-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <HardDrive className="w-4 h-4" /> Space Complexity
              </span>
              <Badge variant="outline" className="font-mono bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30">
                {currentApproachData?.spaceComplexity || "O(1)"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <p className="text-xs text-foreground/80 leading-relaxed font-sans">
              {currentApproachData?.spaceExplanation || "Space complexity analysis based on auxiliary memory allocation."}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Dry Run Execution Section */}
      {currentApproachData?.dryRun && (
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-amber-600 dark:text-amber-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Dry Run Walkthrough
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs font-mono text-foreground/90 whitespace-pre-wrap leading-relaxed bg-card/60 p-4 rounded-lg border border-amber-500/20">
              {currentApproachData.dryRun}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Code Editor Container */}
      <div className="space-y-3">
        <Tabs value={selectedLanguage} onValueChange={(v) => setSelectedLanguage(v as Language)} className="w-full">
          <div className="flex items-center justify-between bg-muted/60 px-4 py-2 rounded-t-xl border border-border/60 border-b-0">
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
            const ex = examplesList.find((e: any) => (e?.language || "").toLowerCase() === lang.toLowerCase()) || currentExample;
            return (
              <TabsContent key={lang} value={lang} className="m-0 border-none outline-none">
                <CodeViewerWithLineNumbers
                  code={ex?.code || `// Code for ${lang}`}
                  language={lang}
                  onCopy={() => handleCopyCode(ex?.code || "", lang)}
                  copied={copiedLanguage === lang}
                />
              </TabsContent>
            );
          })}
        </Tabs>
      </div>

      {/* Interview Tips Card */}
      <Card className="border-indigo-500/20 bg-indigo-500/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
            <Lightbulb className="w-4 h-4" /> Interview Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-xs text-foreground/90 font-sans">
            {interviewTips.map((tip, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-indigo-500 font-bold">•</span>
                <span className="leading-relaxed">{tip}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </motion.div>
  );
}
