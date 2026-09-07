export const ARC = {
  name: "Arc Testnet",
  chainId: 5_042_002,
  rpcUrl: process.env.ARC_RPC_URL ?? "https://rpc.testnet.arc.network",
  usdcErc20: "0x3600000000000000000000000000000000000000",
  nativeDecimals: 18,
  erc20Decimals: 6,
  minRecommendedMaxFeeGwei: 20n,
} as const;
