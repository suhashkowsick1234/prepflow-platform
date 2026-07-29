import React, { useState } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppLogo } from "@/components/ui/app-logo";
import { useWorkspaceStore } from "@/lib/workspace-store";
import { useAuth } from "@/lib/auth-context";
import { requestQueue } from "@/lib/request-queue";
import { prefetchWorkspaceModules } from "@/hooks/use-module-loader";
import {
  Sparkles,
  ArrowRight,
  History,
  Clock,
  BookOpen,
  Zap,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { motion } from "framer-motion";

const EXAMPLE_TOPICS = [
  "React Hooks",
  "Machine Learning Basics",
  "Operating Systems",
  "System Design",
  "Java Collections",
  "PostgreSQL Indexing",
];

export const PENDING_TOPIC_STORAGE_KEY = "prepflow_pending_topic";

export function LandingPage() {
  const [, setLocation] = useLocation();
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { sessions, saveSession, setCurrentSession } = useWorkspaceStore();
  const { isLoggedIn, openLoginModal } = useAuth();

  const pendingTopicRef = React.useRef<string | null>(null);

  const handleGenerate = React.useCallback(async (selectedTopic?: string) => {
    const topicToUse = selectedTopic || topic;
    const trimmed = topicToUse.trim();
    if (!trimmed || loading) return;

    if (!isLoggedIn) {
      sessionStorage.setItem(PENDING_TOPIC_STORAGE_KEY, trimmed);
      pendingTopicRef.current = trimmed;
      setError("Please sign in or sign up to generate a workspace.");
      openLoginModal();
      return;
    }

    setTopic(trimmed);
    setLoading(true);
    setError(null);

    try {
      // 1. Fetch overview only (fast response)
      const overviewData = await requestQueue.fetchModule(
        trimmed,
        "overview",
        "/api/overview"
      );

      // 2. Save session with overview data
      saveSession(trimmed, overviewData as any);

      // 3. Trigger background prefetch for remaining modules
      prefetchWorkspaceModules(trimmed);

      // 4. Navigate immediately to workspace
      setLocation("/workspace");
    } catch (err: any) {
      setError(err?.message ?? "Failed to generate workspace. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [topic, loading, isLoggedIn, openLoginModal, saveSession, setLocation]);

  // Auto-generate topic seamlessly after successful login
  React.useEffect(() => {
    if (isLoggedIn) {
      const storedPending = sessionStorage.getItem(PENDING_TOPIC_STORAGE_KEY) || pendingTopicRef.current;
      if (storedPending) {
        sessionStorage.removeItem(PENDING_TOPIC_STORAGE_KEY);
        pendingTopicRef.current = null;
        setError(null);
        setTopic(storedPending);
        handleGenerate(storedPending);
      }
    }
  }, [isLoggedIn, handleGenerate]);

  const handleResumeSession = (id: string) => {
    setCurrentSession(id);
    setLocation("/workspace");
  };

  const sessionsList = Object.values(sessions).sort((a: any, b: any) => b.createdAt - a.createdAt);

  return (
    <Layout>
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 md:py-20 max-w-4xl mx-auto w-full relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 blur-[130px] rounded-full pointer-events-none -z-10 animate-pulse" />

        {/* Animated App Logo directly above hero heading */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="mb-6 flex justify-center"
        >
          <AppLogo size={64} showText className="scale-110 drop-shadow-xl" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-center space-y-6 mb-10"
        >
          <Badge variant="outline" className="px-4 py-1.5 rounded-full border-primary/30 bg-primary/5 text-primary text-sm shadow-sm backdrop-blur-sm">
            <Sparkles className="w-4 h-4 mr-2" /> AI-Powered Interactive Study Workspace
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold font-display tracking-tight text-foreground leading-[1.1]">
            Master any topic <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-400 to-purple-500">
              in minutes, not hours.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Instant flashcards, 10+ quiz questions, interview prep, cheat sheets, and multi-language code breakdowns generated by AI.
          </p>
        </motion.div>

        {/* Input Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="w-full max-w-2xl mb-8"
        >
          <Card className="border-border/60 shadow-2xl bg-card/80 backdrop-blur-xl rounded-2xl overflow-hidden p-2">
            <CardContent className="p-2 space-y-4">
              <Textarea
                placeholder="What topic do you want to learn today? (e.g. Binary Search Trees, React Server Components...)"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleGenerate();
                  }
                }}
                disabled={loading}
                className="border-none focus-visible:ring-0 text-base md:text-lg resize-none min-h-[100px] p-4 bg-transparent"
              />

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-500 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-border/40">
                <div className="text-xs text-muted-foreground hidden sm:block">
                  Press <kbd className="px-1.5 py-0.5 bg-muted rounded border text-[10px] font-mono">Enter</kbd> to generate
                </div>

                <Button
                  onClick={() => handleGenerate()}
                  disabled={!topic.trim() || loading}
                  className="w-full sm:w-auto font-semibold rounded-xl px-6 h-11 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 gap-2 ml-auto"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Generating...
                    </>
                  ) : (
                    <>
                      Generate Workspace <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Example Topics */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="w-full max-w-2xl mb-12"
        >
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center mb-3">
            Popular Topics
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {EXAMPLE_TOPICS.map((t) => (
              <button
                key={t}
                onClick={() => handleGenerate(t)}
                disabled={loading}
                className="px-3.5 py-1.5 bg-secondary/80 hover:bg-secondary border border-border/50 text-secondary-foreground text-xs rounded-full font-medium transition-all hover:scale-105 active:scale-95"
              >
                {t}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Recent Sessions */}
        {sessionsList.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            className="w-full max-w-2xl"
          >
            <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-muted-foreground">
              <History className="w-4 h-4 text-primary" />
              <span>Recent Learning Workspaces</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {sessionsList.slice(0, 4).map((s: any) => (
                <Card
                  key={s.id}
                  onClick={() => handleResumeSession(s.id)}
                  className="p-4 border-border/40 hover:border-primary/50 bg-card/50 hover:bg-card/90 transition-all cursor-pointer group shadow-sm hover:shadow-md rounded-xl"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 pr-2">
                      <div className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1">
                        {s.topic}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(s.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-[10px] uppercase shrink-0">
                      {s.workspace?.difficulty ?? "Study"}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </Layout>
  );
}

export default LandingPage;
