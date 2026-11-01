// Consent banner logic, ported from the live site. See ConsentBanner.astro.
type Choice = "declined" | "cookies" | "all";
type Fn = (...args: unknown[]) => void;
type Queued = Fn & { q?: unknown[] };
const w = window as unknown as {
  dataLayer: unknown[];
  gtag?: Fn;
  clarity?: Queued;
  WusoolAnalytics?: { setConsent?: (granted: boolean) => void };
  wusoolConsent?: unknown;
};

const NAME = "wusool_analytics_consent";
const VERSION = "2026-10";
const CLARITY_ID = "vngmb7f75n";
const banner = document.getElementById("cookie-banner") as HTMLElement;

const get = () =>
  (document.cookie.match(new RegExp(`(?:^|; )${NAME}=([^;]+)`)) ?? [])[1] ?? "";
const remember = (granted: boolean) => {
  try {
    localStorage.setItem(NAME, granted ? "granted" : "denied");
  } catch {
    /* storage blocked */
  }
};

// Clarity runs only after "Accept all".
let clarityLoaded = false;
const loadClarity = () => {
  if (clarityLoaded) return;
  clarityLoaded = true;
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.clarity.ms/tag/${CLARITY_ID}`;
  document.head.appendChild(s);
};
const clarityConsent = (all: boolean) =>
  w.clarity?.("consentv2", {
    ad_Storage: "denied",
    analytics_Storage: all ? "granted" : "denied",
  });

// Defaults, as on the live site.
w.dataLayer = w.dataLayer || [];
const gtag: Fn =
  w.gtag ||
  function (...args: unknown[]) {
    w.dataLayer.push(args);
  };
w.gtag = gtag;
const initial = get();
try {
  if (initial) remember(initial === "all");
  else localStorage.removeItem(NAME);
} catch {
  /* storage blocked */
}
gtag("consent", "default", {
  analytics_storage:
    initial === "all" || initial === "cookies" ? "granted" : "denied",
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
  wait_for_update: 500,
});
if (!w.clarity) {
  const q: unknown[] = [];
  w.clarity = Object.assign((...args: unknown[]) => void q.push(args), { q });
}
clarityConsent(initial === "all");
if (initial === "all") loadClarity();

function set(v: Choice) {
  const domain = location.hostname.includes("wusoolcapital.com")
    ? ";domain=.wusoolcapital.com"
    : "";
  document.cookie = `${NAME}=${v};path=/;max-age=31536000;SameSite=Lax;Secure${domain}`;
  remember(v === "all");
  gtag("consent", "update", {
    analytics_storage: v === "all" || v === "cookies" ? "granted" : "denied",
  });
  if (v === "all") loadClarity();
  clarityConsent(v === "all");
  // PostHog replay is bundled with its events, so only Accept all turns it on.
  w.WusoolAnalytics?.setConsent?.(v === "all");
  const msg = { type: "wusool-consent", choice: v, version: VERSION };
  document.querySelectorAll("iframe").forEach((f) => {
    try {
      f.contentWindow?.postMessage(msg, "*");
    } catch {
      /* cross-origin frame gone */
    }
  });
  window.dispatchEvent(new CustomEvent("wusool-consent", { detail: msg }));
}

// Opens the banner and moves focus to the first choice.
const openBanner = () => {
  banner.hidden = false;
  banner.querySelector<HTMLButtonElement>("[data-consent]")?.focus();
};
w.wusoolConsent = { get, version: VERSION, open: openBanner };
banner.querySelectorAll<HTMLButtonElement>("[data-consent]").forEach((btn) =>
  btn.addEventListener("click", () => {
    set(btn.dataset.consent as Choice);
    banner.hidden = true;
  }),
);
document.addEventListener("click", (e) => {
  const a = (e.target as Element).closest(
    'a[href="#privacy-choices"],[data-privacy-choices]',
  );
  if (!a) return;
  e.preventDefault();
  openBanner();
});
// Escape closes a reopened banner; a first-time visitor still has to choose.
banner.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && get()) banner.hidden = true;
});
// The banner is visible in the HTML; from here this script controls it.
banner.hidden = !!initial;
document.documentElement.classList.remove("consented");

export {};
