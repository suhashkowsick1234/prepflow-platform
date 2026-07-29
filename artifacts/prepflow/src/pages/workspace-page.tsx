import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { useWorkspaceStore } from "@/lib/workspace-store";
import { useAuth } from "@/lib/auth-context";
import { useModuleLoader, ModuleName } from "@/hooks/use-module-loader";
import { safeFetchJson } from "@/lib/safe-fetch";
import { ModuleSkeleton } from "@/components/ui/module-skeleton";
import { ModuleError } from "@/components/ui/module-error";
import { ErrorBoundary } from "@/components/error-boundary";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  FileText,
  Layers,
  Target,
  MessageSquare,
  FileCode2,
  Code2,
  Link2,
  Edit3,
  Menu,
  X,
  User,
} from "lucide-react";

import { OverviewModule } from "@/components/modules/overview-module";
import { SummaryModule } from "@/components/modules/summary-module";
import { FlashcardsModule } from "@/components/modules/flashcards-module";
import { QuizModule } from "@/components/modules/quiz-module";
import { InterviewQuestionsModule } from "@/components/modules/interview-questions-module";
import { CheatSheetModule } from "@/components/modules/cheat-sheet-module";
import { CodeExamplesModule } from "@/components/modules/code-examples-module";
import { PersonalNotesModule } from "@/components/modules/personal-notes-module";
import { RelatedTopicsModule } from "@/components/modules/related-topics-module";
import { PENDING_TOPIC_STORAGE_KEY } from "./landing-page";

type ModuleType =
  | "overview"
  | "summary"
  | "flashcards"
  | "quiz"
  | "interview"
  | "cheatsheet"
  | "code"
  | "related"
  | "notes";

export function WorkspacePage() {
  const [, setLocation] = useLocation();
  const { currentSessionId, sessions, saveSession, updateSessionWorkspace } = useWorkspaceStore();
  const [activeModule, setActiveModule] = useState<ModuleType>("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const session = currentSessionId ? sessions[currentSessionId] : null;

  useEffect(() => {
    if (!session) {
      setLocation("/");
    }
  }, [session, setLocation]);

  const topic = session?.topic ?? null;
  const workspace = session?.workspace;

  // Module loaders — autoLoad when active
  const flashcardsLoader = useModuleLoader<{ flashcards: any[] }>(topic, "flashcards", { autoLoad: activeModule === "flashcards" });
  const quizLoader = useModuleLoader<{ quiz: any[] }>(topic, "quiz", { autoLoad: activeModule === "quiz" });
  const interviewLoader = useModuleLoader<{ interviewQuestions: any[] }>(topic, "interview", { autoLoad: activeModule === "interview" });
  const cheatSheetLoader = useModuleLoader<{ cheatSheet: any[] }>(topic, "cheatsheet", { autoLoad: activeModule === "cheatsheet" });
  const codeLoader = useModuleLoader<{ codeExample: any }>(topic, "code", { autoLoad: activeModule === "code" });
  const relatedLoader = useModuleLoader<{ relatedTopics: string[] }>(topic, "related", { autoLoad: activeModule === "related" });

  // Sync loaded data into persistent workspace state
  useEffect(() => {
    if (!currentSessionId || !flashcardsLoader.data?.flashcards?.length) return;
    updateSessionWorkspace(currentSessionId, { flashcards: flashcardsLoader.data.flashcards });
  }, [currentSessionId, flashcardsLoader.data]);

  useEffect(() => {
    if (!currentSessionId || !quizLoader.data?.quiz?.length) return;
    updateSessionWorkspace(currentSessionId, { quiz: quizLoader.data.quiz });
  }, [currentSessionId, quizLoader.data]);

  useEffect(() => {
    if (!currentSessionId || !interviewLoader.data?.interviewQuestions?.length) return;
    updateSessionWorkspace(currentSessionId, { interviewQuestions: interviewLoader.data.interviewQuestions });
  }, [currentSessionId, interviewLoader.data]);

  useEffect(() => {
    if (!currentSessionId || !cheatSheetLoader.data?.cheatSheet?.length) return;
    updateSessionWorkspace(currentSessionId, { cheatSheet: cheatSheetLoader.data.cheatSheet });
  }, [currentSessionId, cheatSheetLoader.data]);

  useEffect(() => {
    if (!currentSessionId || !codeLoader.data?.codeExample) return;
    updateSessionWorkspace(currentSessionId, { codeExample: codeLoader.data.codeExample });
  }, [currentSessionId, codeLoader.data]);

  useEffect(() => {
    if (!currentSessionId || !relatedLoader.data?.relatedTopics?.length) return;
    updateSessionWorkspace(currentSessionId, { relatedTopics: relatedLoader.data.relatedTopics });
  }, [currentSessionId, relatedLoader.data]);

  const { isLoggedIn, openLoginModal } = useAuth();

  const handleTopicSelect = useCallback(async (newTopic: string) => {
    const trimmed = newTopic.trim();
    if (!trimmed) return;
    if (!isLoggedIn) {
      sessionStorage.setItem(PENDING_TOPIC_STORAGE_KEY, trimmed);
      openLoginModal();
      return;
    }
    const result = await safeFetchJson("/api/overview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic: trimmed }),
    });
    if (result.ok && result.data) {
      saveSession(trimmed, result.data);
      setActiveModule("overview");
    }
  }, [isLoggedIn, openLoginModal, saveSession]);

  if (!session || !workspace) {
    return null;
  }

  const hasCode =
    workspace.codeExample?.isProgramming === true ||
    (codeLoader.data as any)?.codeExample?.isProgramming === true;

  const navItems: { id: ModuleType; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: "summary", label: "Executive Summary", icon: <FileText className="w-4 h-4" /> },
    { id: "flashcards", label: "Flashcards", icon: <Layers className="w-4 h-4" /> },
    { id: "quiz", label: "MCQ Quiz", icon: <Target className="w-4 h-4" /> },
    { id: "interview", label: "Interview Q's", icon: <MessageSquare className="w-4 h-4" /> },
    { id: "cheatsheet", label: "Revision Cheat Sheet", icon: <FileCode2 className="w-4 h-4" /> },
    ...(hasCode ? [{ id: "code" as const, label: "Coding Examples", icon: <Code2 className="w-4 h-4" /> }] : []),
    { id: "notes", label: "Personal Notes", icon: <Edit3 className="w-4 h-4" /> },
    { id: "related", label: "Related Topics", icon: <Link2 className="w-4 h-4" /> },
  ];

  const renderModuleContent = () => {
    switch (activeModule) {
      case "overview":
        return (
          <ErrorBoundary moduleName="Overview">
            <OverviewModule workspace={workspace} />
          </ErrorBoundary>
        );

      case "summary":
        return (
          <ErrorBoundary moduleName="Summary">
            <SummaryModule workspace={workspace} />
          </ErrorBoundary>
        );

      case "flashcards": {
        const hasCards = (workspace.flashcards?.length ?? 0) > 0;
        if ((flashcardsLoader.status === "loading" || flashcardsLoader.status === "idle") && !hasCards) {
          return <ModuleSkeleton title="Generating flashcards..." type="cards" />;
        }
        if (flashcardsLoader.status === "error" && !hasCards) {
          return <ModuleError moduleName="Flashcards" error={flashcardsLoader.error} onRetry={flashcardsLoader.retry} />;
        }
        return (
          <ErrorBoundary moduleName="Flashcards">
            <FlashcardsModule workspace={workspace} />
          </ErrorBoundary>
        );
      }

      case "quiz": {
        const hasQuiz = (workspace.quiz?.length ?? 0) > 0;
        if ((quizLoader.status === "loading" || quizLoader.status === "idle") && !hasQuiz) {
          return <ModuleSkeleton title="Generating quiz..." type="quiz" />;
        }
        if (quizLoader.status === "error" && !hasQuiz) {
          return <ModuleError moduleName="Quiz" error={quizLoader.error} onRetry={quizLoader.retry} />;
        }
        return (
          <ErrorBoundary moduleName="Quiz">
            <QuizModule workspace={workspace} />
          </ErrorBoundary>
        );
      }

      case "interview": {
        const hasQ = (workspace.interviewQuestions?.length ?? 0) > 0;
        if ((interviewLoader.status === "loading" || interviewLoader.status === "idle") && !hasQ) {
          return <ModuleSkeleton title="Generating interview questions..." type="default" />;
        }
        if (interviewLoader.status === "error" && !hasQ) {
          return <ModuleError moduleName="Interview Questions" error={interviewLoader.error} onRetry={interviewLoader.retry} />;
        }
        return (
          <ErrorBoundary moduleName="Interview Questions">
            <InterviewQuestionsModule workspace={workspace} />
          </ErrorBoundary>
        );
      }

      case "cheatsheet": {
        const hasCS = (workspace.cheatSheet?.length ?? 0) > 0;
        if ((cheatSheetLoader.status === "loading" || cheatSheetLoader.status === "idle") && !hasCS) {
          return <ModuleSkeleton title="Generating cheat sheet..." type="default" />;
        }
        if (cheatSheetLoader.status === "error" && !hasCS) {
          return <ModuleError moduleName="Cheat Sheet" error={cheatSheetLoader.error} onRetry={cheatSheetLoader.retry} />;
        }
        return (
          <ErrorBoundary moduleName="Cheat Sheet">
            <CheatSheetModule workspace={workspace} />
          </ErrorBoundary>
        );
      }

      case "code": {
        const hasCodeContent = Boolean(
          workspace.codeExample?.optimalApproach ||
          workspace.codeExample?.betterApproach ||
          workspace.codeExample?.bruteForce ||
          (Array.isArray(workspace.codeExample?.examples) && workspace.codeExample.examples.length > 0)
        );
        if ((codeLoader.status === "loading" || codeLoader.status === "idle") && !hasCodeContent) {
          return <ModuleSkeleton title="Generating code examples..." type="default" />;
        }
        if (codeLoader.status === "error" && !hasCodeContent) {
          return <ModuleError moduleName="Code Examples" error={codeLoader.error} onRetry={codeLoader.retry} />;
        }
        return (
          <ErrorBoundary moduleName="Code Examples">
            <CodeExamplesModule workspace={workspace} />
          </ErrorBoundary>
        );
      }

      case "notes":
        return (
          <ErrorBoundary moduleName="Notes">
            <PersonalNotesModule workspace={workspace} />
          </ErrorBoundary>
        );

      case "related": {
        const hasRelated = (workspace.relatedTopics?.length ?? 0) > 0;
        if ((relatedLoader.status === "loading" || relatedLoader.status === "idle") && !hasRelated) {
          return <ModuleSkeleton title="Finding related topics..." type="default" />;
        }
        if (relatedLoader.status === "error" && !hasRelated) {
          return <ModuleError moduleName="Related Topics" error={relatedLoader.error} onRetry={relatedLoader.retry} />;
        }
        return (
          <ErrorBoundary moduleName="Related Topics">
            <RelatedTopicsModule workspace={workspace} onTopicSelect={handleTopicSelect} />
          </ErrorBoundary>
        );
      }

      default:
        return null;
    }
  };

  return (
    <Layout showWorkspaceActions workspace={workspace}>
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative print:block">
        {/* Mobile Nav Header */}
        <div className="md:hidden border-b border-border/50 bg-card p-4 flex justify-between items-center z-20 print:hidden">
          <span className="font-semibold flex items-center gap-2 text-sm">
            {navItems.find((n) => n.id === activeModule)?.icon}
            {navItems.find((n) => n.id === activeModule)?.label}
          </span>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 bg-secondary rounded-lg"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Sidebar Nav */}
        <nav
          className={cn(
            "absolute inset-0 z-10 bg-background md:bg-card/40 md:relative w-full md:w-64 lg:w-72 border-r border-border/50 flex flex-col transition-transform duration-300 md:translate-x-0 print:hidden justify-between",
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="p-4 overflow-y-auto flex-1 no-scrollbar space-y-1">
            <div className="px-3 pb-2 text-[10px] font-bold tracking-wider text-muted-foreground uppercase font-mono">
              Learning Modules
            </div>
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveModule(item.id);
                  setMobileMenuOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all text-left",
                  activeModule === item.id
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 font-semibold"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <span
                  className={cn(
                    "shrink-0",
                    activeModule === item.id ? "text-primary-foreground" : "text-primary/70"
                  )}
                >
                  {item.icon}
                </span>
                {item.label}
              </button>
            ))}
          </div>

          <div className="p-4 border-t border-border/40 space-y-2">
            <button
              onClick={() => setLocation("/profile")}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
            >
              <User className="w-4 h-4 text-primary" /> Profile &amp; Stats
            </button>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-background/50 relative">
          <div className="absolute inset-0 bg-grid-primary/[0.02] bg-[size:32px_32px] pointer-events-none" />
          <div className="container max-w-5xl mx-auto p-4 md:p-8 lg:p-10 min-h-full print:p-0 print:m-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeModule}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full print:h-auto"
              >
                {renderModuleContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </Layout>
  );
}
