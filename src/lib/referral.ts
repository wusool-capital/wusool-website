// Referral programme numbers (PRD 6.4), shared by the page copy, the
// calculator markup and its script.
export const FEE_RATE = 0.05; // our average success fee
export const SHARE_RATE = 0.1; // the partner's share of that fee
export const PAYOUT_DAYS = 30;
// Slider range for the transaction value, in US dollars.
export const DEAL = {
  min: 1_000_000,
  max: 25_000_000,
  step: 500_000,
  start: 5_000_000,
};

export function earnings(deal: number) {
  const fee = deal * FEE_RATE;
  return { fee, share: fee * SHARE_RATE };
}

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
export const usd = (n: number) => money.format(n);
