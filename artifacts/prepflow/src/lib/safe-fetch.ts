export interface SafeFetchResult<T = any> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
  isJson: boolean;
  rawText?: string;
}

/**
 * Robust fetch wrapper that checks HTTP status and Content-Type header
 * BEFORE attempting JSON parsing. Prevents "Unexpected token 'T'..." / HTML parse crashes.
 */
export async function safeFetchJson<T = any>(
  url: string,
  options?: RequestInit
): Promise<SafeFetchResult<T>> {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get("content-type") ?? "";
    const isJson = contentType.includes("application/json");

    if (!res.ok) {
      let errorMessage = `HTTP ${res.status} ${res.statusText}`.trim();
      let rawText: string | undefined;

      if (isJson) {
        try {
          const errData = await res.json();
          errorMessage = errData?.message || errData?.error || errorMessage;
        } catch {
          // ignore json parse error on non-ok status
        }
      } else {
        rawText = await res.text();
        console.error(
          `[safeFetchJson] Non-JSON error response from ${url} (Status ${res.status}):\n`,
          rawText
        );
        errorMessage = `Server returned non-JSON error (${res.status}): ${rawText.slice(0, 150)}`;
      }

      return {
        ok: false,
        status: res.status,
        error: errorMessage,
        isJson,
        rawText,
      };
    }

    if (!isJson) {
      const rawText = await res.text();
      console.error(
        `[safeFetchJson] Expected JSON from ${url} but received Content-Type "${contentType}". Response body:\n`,
        rawText
      );
      return {
        ok: false,
        status: res.status,
        error: `Server response is not JSON (Content-Type: "${contentType || "unknown"}").`,
        isJson: false,
        rawText,
      };
    }

    try {
      const data = await res.json();
      return {
        ok: true,
        status: res.status,
        data,
        isJson: true,
      };
    } catch (parseErr: any) {
      console.error(`[safeFetchJson] Failed to parse JSON response from ${url}:`, parseErr);
      return {
        ok: false,
        status: res.status,
        error: `Invalid JSON response: ${parseErr?.message || "Parse failed"}`,
        isJson: true,
      };
    }
  } catch (err: any) {
    if (err?.name === "AbortError") {
      throw err;
    }
    console.error(`[safeFetchJson] Network request error to ${url}:`, err);
    return {
      ok: false,
      status: 0,
      error: err?.message || "Network request failed",
      isJson: false,
    };
  }
}
