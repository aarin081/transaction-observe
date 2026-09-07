import { ARC } from "./config.js";
import { hexToBigInt, rpcCall } from "./rpc.js";
import { nativeUsdcFromWei, weiToGwei } from "./units.js";

type Receipt = {
  transactionHash: string;
  blockNumber: string;
  status: string;
  gasUsed: string;
  effectiveGasPrice: string;
};

type Block = {
  hash: string;
  timestamp: string;
};

const txHash = process.argv[2];

if (!txHash || !/^0x[0-9a-fA-F]{64}$/.test(txHash)) {
  console.error("Usage: npm run receipt -- 0x<64-hex-transaction-hash>");
  process.exit(1);
}

async function main(): Promise<void> {
  const chainId = Number(
    hexToBigInt(await rpcCall<string>(ARC.rpcUrl, "eth_chainId")),
  );

  if (chainId !== ARC.chainId) {
    throw new Error(`Wrong network: expected Arc Testnet ${ARC.chainId}, got ${chainId}`);
  }

  let receipt: Receipt | null = null;
  for (let attempt = 1; attempt <= 10; attempt += 1) {
    receipt = await rpcCall<Receipt | null>(
      ARC.rpcUrl,
      "eth_getTransactionReceipt",
      [txHash],
    );
    if (receipt) break;
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }

  if (!receipt) {
    console.log(JSON.stringify({ network: ARC.name, txHash, state: "pending-or-not-found" }, null, 2));
    process.exitCode = 2;
    return;
  }

  const block = await rpcCall<Block>(ARC.rpcUrl, "eth_getBlockByNumber", [
    receipt.blockNumber,
    false,
  ]);

  const gasUsed = hexToBigInt(receipt.gasUsed);
  const effectiveGasPrice = hexToBigInt(receipt.effectiveGasPrice);
  const feeWei = gasUsed * effectiveGasPrice;

  console.log(
    JSON.stringify(
      {
        network: ARC.name,
        chainId,
        txHash: receipt.transactionHash,
        state: receipt.status === "0x1" ? "confirmed-success" : "confirmed-reverted",
        blockNumber: Number(hexToBigInt(receipt.blockNumber)),
        blockHash: block.hash,
        blockTimestamp: new Date(
          Number(hexToBigInt(block.timestamp)) * 1000,
        ).toISOString(),
        gasUsed: gasUsed.toString(),
        effectiveGasPriceGwei: weiToGwei(effectiveGasPrice),
        feeUsdcNative: nativeUsdcFromWei(feeWei),
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
