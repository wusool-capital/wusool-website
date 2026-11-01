// Sector profiles and deal rows for the valuation tool, served as a file the
// tool loads after the page has drawn (inline they delayed the first paint).
import { sectorProfiles, vcRows } from "../../lib/tools/valuation";

export const GET = () =>
  new Response(JSON.stringify({ profiles: sectorProfiles(), vc: vcRows() }), {
    headers: { "Content-Type": "application/json" },
  });
