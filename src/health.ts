import { ARC } from "./config.js";
import { recommendedMaxFeeWei } from "./fees.js";
import { hexToBigInt, rpcCall } from "./rpc.js";
import { weiToGwei } from "./units.js";

type Block = {
  number: string;
  timestamp: string;
  hash: string;
  transactions: unknown[];
};

async function main(): Promise<void> {
  const started = performance.now();

  const [chainIdHex, blockNumberHex, gasPriceHex, block, decimalsHex] =
    await Promise.all([
      rpcCall<string>(ARC.rpcUrl, "eth_chainId"),
      rpcCall<string>(ARC.rpcUrl, "eth_blockNumber"),
      rpcCall<string>(ARC.rpcUrl, "eth_gasPrice"),
      rpcCall<Block>(ARC.rpcUrl, "eth_getBlockByNumber", ["latest", false]),
      rpcCall<string>(ARC.rpcUrl, "eth_call", [
        { to: ARC.usdcErc20, data: "0x313ce567" },
        "latest",
      ]),
    ]);

  const rpcLatencyMs = Math.round(performance.now() - started);
  const chainId = Number(hexToBigInt(chainIdHex));
  const latestBlock = Number(hexToBigInt(blockNumberHex));
  const observedGasPriceWei = hexToBigInt(gasPriceHex);
  const recommended = recommendedMaxFeeWei(
    observedGasPriceWei,
    ARC.minRecommendedMaxFeeGwei,
  );
  const erc20DecimalsCheck = Number(hexToBigInt(decimalsHex));

  const snapshot = {
    checkedAt: new Date().toISOString(),
    network: ARC.name,
    rpcUrl: ARC.rpcUrl,
    rpcLatencyMs,
    chainId,
    expectedChainId: ARC.chainId,
    chainIdValid: chainId === ARC.chainId,
    latestBlock,
    latestBlockHash: block.hash,
    latestBlockTimestamp: new Date(
      Number(hexToBigInt(block.timestamp)) * 1000,
    ).toISOString(),
    observedGasPriceGwei: weiToGwei(observedGasPriceWei),
    recommendedMaxFeeGwei: weiToGwei(recommended),
    usdc: {
      nativeDecimals: ARC.nativeDecimals,
      erc20Decimals: ARC.erc20Decimals,
      erc20Address: ARC.usdcErc20,
      erc20DecimalsCheck,
      decimalsCheckValid: erc20DecimalsCheck === ARC.erc20Decimals,
    },
  };

  console.log(JSON.stringify(snapshot, null, 2));

  if (!snapshot.chainIdValid || !snapshot.usdc.decimalsCheckValid) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
