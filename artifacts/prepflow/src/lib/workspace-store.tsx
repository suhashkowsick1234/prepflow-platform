import React, { createContext, useContext, useEffect, useState } from "react";
import { LearningWorkspace } from "@workspace/api-client-react";

export interface Session {
  id: string;
  topic: string;
  createdAt: number;
  workspace: LearningWorkspace;
}

export interface QuizResult {
  score: number;
  total: number;
  accuracy: number;
  completedAt: number;
}

interface WorkspaceState {
  currentSessionId: string | null;
  sessions: Record<string, Session>;
  notes: Record<string, string>;
  bookmarks: Record<string, number[]>; // sessionId -> array of card indices
  quizResults: Record<string, QuizResult[]>; // sessionId -> array of quiz results
  animationsEnabled: boolean;

  setCurrentSession: (id: string | null) => void;
  saveSession: (topic: string, workspace: Partial<LearningWorkspace>) => string;
  updateSessionWorkspace: (id: string, partial: Partial<LearningWorkspace>) => void;
  deleteSession: (id: string) => void;
  clearHistory: () => void;
  saveNotes: (id: string, note: string) => void;
  toggleAnimations: (enabled: boolean) => void;
  toggleBookmark: (sessionId: string, cardIndex: number) => void;
  isBookmarked: (sessionId: string, cardIndex: number) => boolean;
  saveQuizResult: (sessionId: string, result: QuizResult) => void;
  getOverallAccuracy: () => number;
  getTotalFlashcardsLearned: () => number;
  getStudyStreak: () => number;
}

const WorkspaceContext = createContext<WorkspaceState | undefined>(undefined);

const STORAGE_KEY = "prepflow-storage";

type StoredState = Omit<WorkspaceState,
  | "setCurrentSession"
  | "saveSession"
  | "updateSessionWorkspace"
  | "deleteSession"
  | "clearHistory"
  | "saveNotes"
  | "toggleAnimations"
  | "toggleBookmark"
  | "isBookmarked"
  | "saveQuizResult"
  | "getOverallAccuracy"
  | "getTotalFlashcardsLearned"
  | "getStudyStreak"
>;

const defaultState: StoredState = {
  currentSessionId: null,
  sessions: {},
  notes: {},
  bookmarks: {},
  quizResults: {},
  animationsEnabled: true,
};

function createEmptyWorkspace(topic: string, partial: Partial<LearningWorkspace>): LearningWorkspace {
  const isProg = (partial as any).isProgramming === true || partial.codeExample?.isProgramming === true;
  return {
    title: partial.title ?? topic,
    description: partial.description ?? "",
    estimatedStudyTime: partial.estimatedStudyTime ?? "2-3 hours",
    difficulty: partial.difficulty ?? "Intermediate",
    summary: partial.summary ?? "",
    keyPoints: partial.keyPoints ?? [],
    flashcards: partial.flashcards ?? [],
    quiz: partial.quiz ?? [],
    interviewQuestions: partial.interviewQuestions ?? [],
    cheatSheet: partial.cheatSheet ?? [],
    practiceTips: partial.practiceTips ?? [],
    codeExample: partial.codeExample ?? { isProgramming: isProg },
    relatedTopics: partial.relatedTopics ?? [],
    ...partial,
  } as LearningWorkspace;
}

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<StoredState>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...defaultState,
          ...parsed,
        };
      }
    } catch (e) {
      console.error("Failed to parse storage", e);
    }
    return defaultState;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const setCurrentSession = (id: string | null) =>
    setState((prev) => ({ ...prev, currentSessionId: id }));

  const saveSession = (topic: string, partial: Partial<LearningWorkspace>): string => {
    const id = crypto.randomUUID();
    const fullWorkspace = createEmptyWorkspace(topic, partial);

    setState((prev) => ({
      ...prev,
      sessions: {
        ...prev.sessions,
        [id]: { id, topic, createdAt: Date.now(), workspace: fullWorkspace },
      },
      currentSessionId: id,
    }));
    return id;
  };

  const updateSessionWorkspace = (id: string, partial: Partial<LearningWorkspace>) => {
    setState((prev) => {
      const existing = prev.sessions[id];
      if (!existing) return prev;

      return {
        ...prev,
        sessions: {
          ...prev.sessions,
          [id]: {
            ...existing,
            workspace: {
              ...existing.workspace,
              ...partial,
            },
          },
        },
      };
    });
  };

  const deleteSession = (id: string) => {
    setState((prev) => {
      const newSessions = { ...prev.sessions };
      delete newSessions[id];
      const newBookmarks = { ...prev.bookmarks };
      delete newBookmarks[id];
      const newQuizResults = { ...prev.quizResults };
      delete newQuizResults[id];
      return {
        ...prev,
        sessions: newSessions,
        bookmarks: newBookmarks,
        quizResults: newQuizResults,
        currentSessionId: prev.currentSessionId === id ? null : prev.currentSessionId,
      };
    });
  };

  const clearHistory = () =>
    setState((prev) => ({
      ...prev,
      sessions: {},
      currentSessionId: null,
      notes: {},
      bookmarks: {},
      quizResults: {},
    }));

  const saveNotes = (id: string, note: string) =>
    setState((prev) => ({
      ...prev,
      notes: { ...prev.notes, [id]: note },
    }));

  const toggleAnimations = (enabled: boolean) =>
    setState((prev) => ({ ...prev, animationsEnabled: enabled }));

  const toggleBookmark = (sessionId: string, cardIndex: number) => {
    setState((prev) => {
      const current = prev.bookmarks[sessionId] ?? [];
      const exists = current.includes(cardIndex);
      const updated = exists
        ? current.filter((i) => i !== cardIndex)
        : [...current, cardIndex];
      return {
        ...prev,
        bookmarks: { ...prev.bookmarks, [sessionId]: updated },
      };
    });
  };

  const isBookmarked = (sessionId: string, cardIndex: number): boolean => {
    return (state.bookmarks[sessionId] ?? []).includes(cardIndex);
  };

  const saveQuizResult = (sessionId: string, result: QuizResult) => {
    setState((prev) => ({
      ...prev,
      quizResults: {
        ...prev.quizResults,
        [sessionId]: [...(prev.quizResults[sessionId] ?? []), result],
      },
    }));
  };

  const getOverallAccuracy = (): number => {
    const allResults = Object.values(state.quizResults).flat();
    if (allResults.length === 0) return 0;
    const totalScore = allResults.reduce((sum, r) => sum + r.score, 0);
    const totalQuestions = allResults.reduce((sum, r) => sum + r.total, 0);
    return totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;
  };

  const getTotalFlashcardsLearned = (): number => {
    return Object.values(state.bookmarks).reduce((sum, arr) => sum + arr.length, 0);
  };

  const getStudyStreak = (): number => {
    const sessions = Object.values(state.sessions).sort((a, b) => b.createdAt - a.createdAt);
    if (sessions.length === 0) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days = new Set(
      sessions.map((s) => {
        const d = new Date(s.createdAt);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      })
    );

    let streak = 0;
    let current = today.getTime();
    while (days.has(current)) {
      streak++;
      current -= 86400000;
    }
    return streak;
  };

  const value: WorkspaceState = {
    ...state,
    setCurrentSession,
    saveSession,
    updateSessionWorkspace,
    deleteSession,
    clearHistory,
    saveNotes,
    toggleAnimations,
    toggleBookmark,
    isBookmarked,
    saveQuizResult,
    getOverallAccuracy,
    getTotalFlashcardsLearned,
    getStudyStreak,
  };

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspaceStore() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error("useWorkspaceStore must be used within a WorkspaceProvider");
  }
  return context;
}
