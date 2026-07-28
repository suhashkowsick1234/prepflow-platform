import { ModuleName, getCachedModule, setCachedModule } from "./module-cache";

/**
 * ARCHITECTURAL DESIGN DECISION: Custom Single-Concurrency Request Queue
 * 
 * WHY:
 * 1. Groq / free-tier LLM APIs impose strict rate limits (TPM / RPM). Invoking 7 parallel HTTP requests
 *    instantly triggers HTTP 429 rate limit spikes.
 * 2. Deduplication: If background prefetching is active and the user clicks a tab, we MUST NOT launch duplicate
 *    network requests for the same topic + module.
 * 3. Topic Cancellation: When a user switches topics mid-stream, active in-flight controllers are aborted immediately
 *    to preserve network bandwidth and API quota.
 * 
 * ALTERNATIVE APPROACHES CONSIDERED:
 * - Axios Interceptors: Lacks global topic-based batch cancellation and fine-grained queuing concurrency.
 * - TanStack Query / React Query: Great for standard REST caching, but doesn't natively handle sequential execution
 *   queuing across independent hook instances without complex mutex plugins.
 * 
 * TRADE-OFFS:
 * - Single concurrency (`maxActive = 1`) increases end-to-end load time for all 7 modules, but eliminates 429 errors
 *   and ensures 100% completion reliability.
 */

interface QueueTask {
  id: string; // "topic:module"
  topic: string;
  module: ModuleName;
  endpoint: string;
  body?: any;
  controller: AbortController;
  resolve: (data: any) => void;
  reject: (err: any) => void;
}

class RequestQueue {
  private queue: QueueTask[] = [];
  private activeCount = 0;
  private maxActive = 1;
  private currentTopic: string | null = null;
  private activeControllers: Set<AbortController> = new Set();
  private activePromises: Map<string, Promise<any>> = new Map();

  public setTopic(topic: string) {
    if (this.currentTopic !== topic) {
      this.cancelAll();
      this.currentTopic = topic;
    }
  }

  public cancelAll() {
    // Abort all running requests
    this.activeControllers.forEach((c) => c.abort());
    this.activeControllers.clear();
    this.activePromises.clear();

    // Reject all queued tasks
    for (const task of this.queue) {
      task.controller.abort();
      task.reject(new Error("Request cancelled due to topic change"));
    }
    this.queue = [];
    this.activeCount = 0;
  }

  public async fetchModule<T>(
    topic: string,
    module: ModuleName,
    endpoint: string,
    body: any = {}
  ): Promise<T> {
    this.setTopic(topic);

    // 1. Check IndexedDB cache first
    const cached = await getCachedModule<T>(topic, module);
    if (cached) return cached;

    const id = `${topic.trim().toLowerCase()}:${module}`;

    // 2. Check if currently active/running in-flight
    const activePromise = this.activePromises.get(id);
    if (activePromise) {
      return activePromise;
    }

    // 3. Check if already queued
    const existing = this.queue.find((t) => t.id === id);
    if (existing) {
      return new Promise<T>((resolve, reject) => {
        const origResolve = existing.resolve;
        const origReject = existing.reject;
        existing.resolve = (d) => { origResolve(d); resolve(d); };
        existing.reject = (e) => { origReject(e); reject(e); };
      });
    }

    // 4. Create new queue task
    const controller = new AbortController();

    return new Promise<T>((resolve, reject) => {
      const task: QueueTask = {
        id,
        topic,
        module,
        endpoint,
        body: { topic, ...body },
        controller,
        resolve,
        reject,
      };

      this.queue.push(task);
      this.processNext();
    });
  }

  private async processNext() {
    if (this.activeCount >= this.maxActive || this.queue.length === 0) {
      return;
    }

    const task = this.queue.shift()!;
    this.activeCount++;
    this.activeControllers.add(task.controller);

    const taskPromise = (async () => {
      try {
        const data = await this.executeWithRetry(task);
        if (!task.controller.signal.aborted) {
          await setCachedModule(task.topic, task.module, data);
          task.resolve(data);
          return data;
        }
      } catch (err) {
        if (!task.controller.signal.aborted) {
          task.reject(err);
        }
        throw err;
      } finally {
        this.activePromises.delete(task.id);
        this.activeControllers.delete(task.controller);
        this.activeCount--;
        this.processNext();
      }
    })();

    this.activePromises.set(task.id, taskPromise);
  }

  private async executeWithRetry(task: QueueTask): Promise<any> {
    const RETRY_DELAYS = [2000, 4000, 8000];
    let lastError: any;

    for (let attempt = 0; attempt <= 3; attempt++) {
      if (task.controller.signal.aborted) {
        throw new Error("Aborted");
      }

      if (attempt > 0) {
        const delay = RETRY_DELAYS[attempt - 1] ?? 8000;
        await new Promise((r) => setTimeout(r, delay));
        if (task.controller.signal.aborted) throw new Error("Aborted");
      }

      try {
        const res = await fetch(task.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(task.body),
          signal: task.controller.signal,
        });

        const data = await res.json();

        if (!res.ok) {
          const err = new Error(data?.message ?? `HTTP ${res.status}`);
          (err as any).status = res.status;
          throw err;
        }

        return data;
      } catch (err: any) {
        if (task.controller.signal.aborted || err.name === "AbortError") {
          throw new Error("Aborted");
        }

        lastError = err;

        // Only retry on 429 Rate Limit
        if (err.status === 429 && attempt < 3) {
          continue;
        }

        throw err;
      }
    }

    throw lastError;
  }
}

export const requestQueue = new RequestQueue();
