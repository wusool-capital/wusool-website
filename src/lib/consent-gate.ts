// Runs in <head> before first paint: hides the cookie banner for a visitor
// who already chose. Its sha256 is in the CSP in public/_headers, and
// check:dist fails if the two drift apart.
export const CONSENT_GATE =
  'if(/(?:^|; )wusool_analytics_consent=/.test(document.cookie))document.documentElement.classList.add("consented")';
