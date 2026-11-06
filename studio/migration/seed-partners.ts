// Sample partners, one per category, so /partners and its quiz can be
// checked before the real list arrives. Runs only when no partner exists.
// Replace or delete them in Studio before launch.
//
//   npx sanity exec migration/seed-partners.ts
import { createClient } from "@sanity/client";
import { projectId, dataset } from "../env";

const client = createClient({
  projectId,
  dataset,
  apiVersion: "2025-01-01",
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
});

const samples = [
  [
    "cap-table",
    "Sample cap table partner",
    "Keeps your shareholder register and option plans in one place.",
    "code",
    ["1-5m", "5-25m"],
    [],
  ],
  [
    "lending",
    "Sample lending partner",
    "Working capital and term loans for profitable GCC SMEs.",
    "landing",
    ["1-5m", "5-25m", "over-25m"],
    ["uae-mainland", "uae-freezone"],
  ],
  [
    "accounting",
    "Sample accounting partner",
    "Monthly books and management accounts buyers can rely on.",
    "link",
    [],
    [],
  ],
  [
    "audit-tax",
    "Sample audit and tax partner",
    "Audited accounts and UAE corporate tax filing.",
    "link",
    ["5-25m", "over-25m"],
    ["uae-mainland", "uae-freezone"],
  ],
  [
    "csp",
    "Sample corporate services partner",
    "Company setup, licence renewals and visas across UAE free zones.",
    "code",
    ["under-1m", "1-5m"],
    ["uae-freezone"],
  ],
  [
    "legal",
    "Sample legal partner",
    "Shareholder agreements, contracts and disputes for growing companies.",
    "link",
    [],
    ["uae-mainland", "uae-freezone", "ksa"],
  ],
  [
    "banking",
    "Sample banking partner",
    "Business accounts and cash management for GCC companies.",
    "link",
    [],
    ["uae-mainland", "ksa", "gcc-other"],
  ],
] as const;

const existing = await client.fetch<number>(`count(*[_type == "partner"])`);
if (existing) {
  console.log(`${existing} partners exist; nothing seeded`);
} else {
  const tx = client.transaction();
  samples.forEach(
    ([category, name, description, linkType, sizes, locations], i) =>
      tx.create({
        _type: "partner",
        name,
        category,
        description,
        linkType,
        url: `https://example.com/${category}`,
        ...(linkType === "code" && { code: "WUSOOL20" }),
        offer: "20% off for companies we refer",
        sizes: [...sizes],
        locations: [...locations],
        active: true,
        order: i,
      }),
  );
  await tx.commit();
  console.log(`${samples.length} sample partners created`);
}
