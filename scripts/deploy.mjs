import fs from "node:fs";
import solc from "solc";
import {
  ContractFactory,
  JsonRpcProvider,
  Wallet,
  formatEther,
  parseUnits,
} from "ethers";

const RPC_URL = process.env.ARC_RPC_URL ?? "https://rpc.testnet.arc.io";
const RAW_PRIVATE_KEY = process.env.ARC_PRIVATE_KEY?.trim();
const PRIVATE_KEY = RAW_PRIVATE_KEY
  ? RAW_PRIVATE_KEY.startsWith("0x")
    ? RAW_PRIVATE_KEY
    : `0x${RAW_PRIVATE_KEY}`
  : undefined;
const EXPECTED_CHAIN_ID = 5_042_002n;
const SOURCE_PATH = "contracts/ArcObservationRegistry.sol";
const CONTRACT_NAME = "ArcObservationRegistry";

if (!PRIVATE_KEY || !/^0x[0-9a-fA-F]{64}$/.test(PRIVATE_KEY)) {
  throw new Error(
    "ARC_PRIVATE_KEY is missing or invalid. Add a fresh testnet-only private key as a GitHub Actions secret; never commit or paste it into source code.",
  );
}

const source = fs.readFileSync(SOURCE_PATH, "utf8");
const compilerInput = {
  language: "Solidity",
  sources: {
    [SOURCE_PATH]: { content: source },
  },
  settings: {
    optimizer: { enabled: false, runs: 200 },
    evmVersion: "paris",
    outputSelection: {
      "*": {
        "*": ["abi", "evm.bytecode.object"],
      },
    },
  },
};

const output = JSON.parse(solc.compile(JSON.stringify(compilerInput)));
const errors = output.errors ?? [];
for (const item of errors) {
  const line = `${item.severity}: ${item.formattedMessage}`;
  if (item.severity === "error") console.error(line);
  else console.warn(line);
}
if (errors.some((item) => item.severity === "error")) {
  throw new Error("Solidity compilation failed");
}

const artifact = output.contracts[SOURCE_PATH][CONTRACT_NAME];
const abi = artifact.abi;
const bytecode = `0x${artifact.evm.bytecode.object}`;

const provider = new JsonRpcProvider(RPC_URL);
const network = await provider.getNetwork();
if (network.chainId !== EXPECTED_CHAIN_ID) {
  throw new Error(
    `Wrong network: expected Arc Testnet ${EXPECTED_CHAIN_ID}, got ${network.chainId}`,
  );
}

const wallet = new Wallet(PRIVATE_KEY, provider);
const deployer = await wallet.getAddress();
const balance = await provider.getBalance(deployer);

console.log(`Arc Testnet deployer: ${deployer}`);
console.log(`Native USDC balance: ${formatEther(balance)}`);

if (balance === 0n) {
  throw new Error(
    "Deployer has no native USDC. Fund this Arc Testnet address from the Circle Faucet, then retry.",
  );
}

const feeOverrides = {
  maxFeePerGas: parseUnits("50", "gwei"),
  maxPriorityFeePerGas: parseUnits("1", "gwei"),
};

const factory = new ContractFactory(abi, bytecode, wallet);
const contract = await factory.deploy(feeOverrides);
const deployTx = contract.deploymentTransaction();
if (!deployTx) throw new Error("Deployment transaction was not created");

console.log(`Deployment transaction: ${deployTx.hash}`);
await contract.waitForDeployment();
const contractAddress = await contract.getAddress();
console.log(`Contract deployed: ${contractAddress}`);

const block = await provider.getBlock("latest");
if (!block || !block.hash) throw new Error("Could not read latest Arc block");
const feeData = await provider.getFeeData();
const observedGasPriceWei = feeData.gasPrice ?? parseUnits("20", "gwei");

const recordTx = await contract.recordObservation(
  BigInt(block.number),
  block.hash,
  observedGasPriceWei,
  feeOverrides,
);
console.log(`Observation transaction: ${recordTx.hash}`);
await recordTx.wait();

const result = {
  network: "Arc Testnet",
  chainId: Number(EXPECTED_CHAIN_ID),
  rpcUrl: RPC_URL,
  deployer,
  contractName: CONTRACT_NAME,
  contractAddress,
  deploymentTxHash: deployTx.hash,
  observationTxHash: recordTx.hash,
  observedBlock: block.number,
  observedBlockHash: block.hash,
  observedGasPriceWei: observedGasPriceWei.toString(),
  compilerVersion: solc.version(),
  explorerContractUrl: `https://testnet.arcscan.app/address/${contractAddress}`,
  explorerDeploymentTxUrl: `https://testnet.arcscan.app/tx/${deployTx.hash}`,
  explorerObservationTxUrl: `https://testnet.arcscan.app/tx/${recordTx.hash}`,
  deployedAt: new Date().toISOString(),
};

fs.writeFileSync("deployment.json", `${JSON.stringify(result, null, 2)}\n`);
fs.writeFileSync("standard-input.json", `${JSON.stringify(compilerInput)}\n`);

console.log("DEPLOYMENT_RESULT_START");
console.log(JSON.stringify(result, null, 2));
console.log("DEPLOYMENT_RESULT_END");
