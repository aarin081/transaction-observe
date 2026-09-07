const TEN = 10n;

export function formatUnits(value: bigint, decimals: number): string {
  const base = TEN ** BigInt(decimals);
  const whole = value / base;
  const fraction = value % base;
  if (fraction === 0n) return whole.toString();

  const padded = fraction.toString().padStart(decimals, "0").replace(/0+$/, "");
  return `${whole}.${padded}`;
}

export function nativeUsdcFromWei(value: bigint): string {
  return formatUnits(value, 18);
}

export function erc20UsdcFromMinor(value: bigint): string {
  return formatUnits(value, 6);
}

export function weiToGwei(value: bigint): string {
  return formatUnits(value, 9);
}
