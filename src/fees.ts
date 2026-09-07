const GWEI = 1_000_000_000n;

export function recommendedMaxFeeWei(
  observedGasPriceWei: bigint,
  minimumGwei = 20n,
): bigint {
  const doubledObserved = observedGasPriceWei * 2n;
  const floor = minimumGwei * GWEI;
  return doubledObserved > floor ? doubledObserved : floor;
}
