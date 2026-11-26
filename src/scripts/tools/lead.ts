// Shared by the three tools: one JSON POST to the tools API, the analytics
// block that rides with a lead, and the messages for each way a call fails.
// Dev builds fall back to the dev backend. A production build without
// PUBLIC_TOOLS_API sends nothing, so a lead never reaches the wrong system.
const API: string | undefined =
  import.meta.env.PUBLIC_TOOLS_API ??
  (import.meta.env.DEV ? "https://63-184-6-136.sslip.io" : undefined);

export type Fail = "invalid" | "busy" | "conflict" | "server" | "network";
export class ApiError extends Error {
  constructor(readonly kind: Fail) {
    super(kind);
  }
}
export const FAIL_TEXT: Record<Fail, string> = {
  invalid: "Check your answers and try again.",
  busy: "Too many requests from your connection. Wait a few minutes and try again.",
  conflict: "We already have this submission.",
  server: "Something went wrong on our side. Try again.",
  network:
    "We could not reach the server. Check your connection and try again.",
};

export const newId = () => crypto.randomUUID();

// "example.com" from "https://www.example.com/about".
export const cleanDomain = (v: string) =>
  v
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .split(/[/?#]/)[0]
    .toLowerCase();

// Consent is true only after Accept all. UTM tags come from the query string.
// No visitor id: it comes from PostHog, which this site does not load yet.
export function analytics() {
  const consent = /(?:^|; )wusool_analytics_consent=all(?:;|$)/.test(
    document.cookie,
  );
  const q = new URLSearchParams(location.search);
  const utm: Record<string, string> = {};
  for (const k of ["source", "medium", "campaign", "term", "content"]) {
    const v = q.get(`utm_${k}`)?.trim().slice(0, 200);
    if (v) utm[k] = v;
  }
  return Object.keys(utm).length ? { consent, utm } : { consent };
}

export async function post<T = unknown>(
  path: string,
  body: object,
  keepalive = false,
): Promise<T> {
  if (!API) throw new ApiError("server");
  let r: Response;
  try {
    r = await fetch(API + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive,
    });
  } catch {
    throw new ApiError("network");
  }
  if (!r.ok)
    throw new ApiError(
      r.status === 429
        ? "busy"
        : r.status === 409
          ? "conflict"
          : r.status >= 500
            ? "server"
            : "invalid",
    );
  return r.json() as Promise<T>;
}
