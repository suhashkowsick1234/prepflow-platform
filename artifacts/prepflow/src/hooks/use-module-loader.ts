import { useState, useEffect, useCallback, useRef } from "react";
import { ModuleName, getCachedModule } from "../lib/module-cache";
export type { ModuleName };
import { requestQueue } from "../lib/request-queue";

export type LoadingStatus = "idle" | "loading" | "success" | "error";

interface UseModuleLoaderResult<T> {
  data: T | null;
  status: LoadingStatus;
  error: string | null;
  load: () => Promise<T | null>;
  retry: () => Promise<T | null>;
}

const MODULE_ENDPOINTS: Record<ModuleName, string> = {
  overview: "/api/overview",
  flashcards: "/api/flashcards",
  quiz: "/api/quiz",
  interview: "/api/interview",
  cheatsheet: "/api/cheatsheet",
  code: "/api/code",
  related: "/api/related",
};

export function useModuleLoader<T>(
  topic: string | null | undefined,
  module: ModuleName,
  options: { autoLoad?: boolean } = {}
): UseModuleLoaderResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [status, setStatus] = useState<LoadingStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const load = useCallback(async (): Promise<T | null> => {
    if (!topic || !topic.trim()) return null;
    const trimmed = topic.trim();

    // Check IndexedDB cache first
    try {
      const cached = await getCachedModule<T>(trimmed, module);
      if (cached) {
        if (isMountedRef.current) {
          setData(cached);
          setStatus("success");
          setError(null);
        }
        return cached;
      }
    } catch {
      // Cache check failed — proceed to network
    }

    if (isMountedRef.current) {
      setStatus("loading");
      setError(null);
    }

    try {
      const endpoint = MODULE_ENDPOINTS[module];
      const result = await requestQueue.fetchModule<T>(trimmed, module, endpoint);

      if (isMountedRef.current) {
        setData(result);
        setStatus("success");
        setError(null);
      }
      return result;
    } catch (err: any) {
      const isAbort =
        err?.message === "Request cancelled due to topic change" ||
        err?.name === "AbortError" ||
        err?.message === "Aborted";

      if (isAbort) return null;

      if (isMountedRef.current) {
        setStatus("error");
        setError(err?.message ?? "Failed to load module content.");
      }
      return null;
    }
  }, [topic, module]);

  const retry = useCallback(async (): Promise<T | null> => {
    return load();
  }, [load]);

  // Auto-load trigger when autoLoad flag is true
  const shouldAutoLoad = Boolean(options.autoLoad);

  useEffect(() => {
    if (shouldAutoLoad && topic && topic.trim()) {
      load();
    }
  }, [shouldAutoLoad, topic, module, load]);

  return { data, status, error, load, retry };
}

/**
 * Background Prefetcher:
 * Prefetches all remaining workspace modules in background.
 */
export function prefetchWorkspaceModules(topic: string) {
  if (!topic || !topic.trim()) return;

  const sequence: ModuleName[] = [
    "flashcards",
    "quiz",
    "interview",
    "cheatsheet",
    "related",
    "code",
  ];

  setTimeout(async () => {
    for (const mod of sequence) {
      try {
        const cached = await getCachedModule(topic, mod);
        if (!cached) {
          await requestQueue.fetchModule(topic, mod, MODULE_ENDPOINTS[mod]);
        }
      } catch {
        // Silently handle prefetch errors
      }
    }
  }, 100);
}
