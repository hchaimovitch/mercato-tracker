export function parseFee(fee: string): number {
  const n = Number(String(fee).replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

export function fmtMoney(m: number): string {
  return m >= 1000 ? `€${(m / 1000).toFixed(1)}B` : `€${Math.round(m)}M`;
}

export function fmtNet(net: number): string {
  return (net >= 0 ? '+' : '−') + fmtMoney(Math.abs(net));
}
