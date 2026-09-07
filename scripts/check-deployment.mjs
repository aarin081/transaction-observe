import fs from "node:fs";
import { Contract, JsonRpcProvider } from "ethers";

const RPC_URL = process.env.ARC_RPC_URL ?? "https://rpc.testnet.arc.io";
const evidence = JSON.parse(fs.readFileSync("docs/deployment.json", "utf8"));
const provider = new JsonRpcProvider(RPC_URL);

const network = await provider.getNetwork();
if (Number(network.chainId) !== evidence.chainId) {
  throw new Error(
    `Wrong network: expected Arc Testnet ${evidence.chainId}, got ${network.chainId}`,
  );
}

const code = await provider.getCode(evidence.contractAddress);
if (!code || code === "0x") {
  throw new Error(`No contract bytecode found at ${evidence.contractAddress}`);
}

const [deploymentReceipt, observationReceipt] = await Promise.all([
  provider.getTransactionReceipt(evidence.deploymentTxHash),
  provider.getTransactionReceipt(evidence.observationTxHash),
]);

if (!deploymentReceipt || deploymentReceipt.status !== 1) {
  throw new Error("Deployment transaction is missing or did not succeed");
}
if (!observationReceipt || observationReceipt.status !== 1) {
  throw new Error("Observation transaction is missing or did not succeed");
}

const contract = new Contract(
  evidence.contractAddress,
  [
    "function owner() view returns (address)",
    "function latestObservation() view returns (uint64 blockNumber, uint64 observedAt, uint128 gasPriceWei, bytes32 blockHash)",
  ],
  provider,
);

const [owner, observation] = await Promise.all([
  contract.owner(),
  contract.latestObservation(),
]);

if (owner.toLowerCase() !== evidence.deployer.toLowerCase()) {
  throw new Error(`Unexpected registry owner: ${owner}`);
}
if (observation.blockNumber !== BigInt(evidence.observedBlock)) {
  throw new Error(
    `Unexpected observed block: ${observation.blockNumber} != ${evidence.observedBlock}`,
  );
}
if (observation.blockHash.toLowerCase() !== evidence.observedBlockHash.toLowerCase()) {
  throw new Error("Stored observation block hash does not match deployment evidence");
}
if (observation.gasPriceWei !== BigInt(evidence.observedGasPriceWei)) {
  throw new Error("Stored gas price does not match deployment evidence");
}

console.log(
  JSON.stringify(
    {
      network: "Arc Testnet",
      chainId: evidence.chainId,
      contractAddress: evidence.contractAddress,
      contractCodePresent: true,
      deploymentTransactionSucceeded: true,
      observationTransactionSucceeded: true,
      ownerMatches: true,
      observationMatches: true,
      sourceVerifiedOnArcScan: evidence.sourceVerified,
    },
    null,
    2,
  ),
);
