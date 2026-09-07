# Arc Transaction Observer

[![Arc observer CI](https://github.com/aarin081/transaction-observe/actions/workflows/ci.yml/badge.svg)](https://github.com/aarin081/transaction-observe/actions/workflows/ci.yml)

A small developer-infrastructure project for inspecting **Arc Testnet** transaction behavior and validating Arc-specific assumptions with executable checks.

It checks Arc RPC health, validates the chain ID, reports current block and gas conditions, verifies Arc's USDC ERC-20 interface, tracks transaction receipts, and verifies a deployed onchain observation registry. It also makes Arc's USDC accounting model explicit: **native USDC uses 18-decimal EVM units for gas/value math, while the ERC-20 interface uses 6 decimals for token balances and transfers**.

The core observer is read-only. A separate manual-only GitHub Actions workflow can deploy and verify the observation registry using a repository secret; no private key is committed to the repository.

## What this demonstrates

This repository is intentionally focused on developer observability rather than a consumer-facing dApp. It demonstrates:

- direct JSON-RPC interaction with Arc Testnet
- Arc chain-ID and live-network validation
- native-USDC and ERC-20 decimal handling
- gas observation and conservative fee calculation
- transaction receipt and fee inspection
- Solidity compilation and interface tests
- an onchain registry deployment and state-changing observation transaction
- ArcScan source verification
- CI checks against both live Arc RPC data and the deployed contract

## Arc assumptions checked by the project

- Arc Testnet chain ID: `5042002`
- Primary RPC: `https://rpc.testnet.arc.io`
- USDC is the native gas asset
- Native value/gas math uses 18-decimal units
- The USDC ERC-20 interface uses 6 decimals
- Arc Testnet enforces a 20 gwei minimum base fee

The goal is to turn these assumptions into executable checks instead of leaving them as documentation-only knowledge.

## Features

### Live network health

`npm run health` produces a JSON snapshot containing:

- RPC endpoint and latency
- chain ID validation
- latest block number, hash and timestamp
- observed gas price
- recommended max fee per gas
- native/USDC decimal model
- USDC ERC-20 `decimals()` check against the Arc system address

### Transaction receipt tracker

Given an Arc Testnet transaction hash, the tracker polls for its receipt and reports:

- success or revert state
- block number, hash and timestamp
- gas used
- effective gas price
- transaction fee expressed as native USDC

```bash
npm run receipt -- 0x<transaction-hash>
```

### Onchain deployment evidence check

`npm run evidence` re-checks public deployment evidence directly against Arc Testnet. It verifies that:

- contract bytecode exists at the recorded address
- the deployment transaction succeeded
- the observation transaction succeeded
- the registry owner matches the recorded deployer
- the registry's latest observation matches the recorded Arc block, block hash and gas price

Public deployment facts are stored in `docs/deployment.json`. No secret material is stored there.

### Tests and CI

`npm test` covers the Arc native/USDC unit model, fee-floor logic, Solidity compilation and the registry interface. GitHub Actions runs typechecking, the test suite, a live Arc Testnet health check, and the public deployment-evidence check on pushes and pull requests.

## Verified Arc Testnet deployment

`ArcObservationRegistry` was deployed on Arc Testnet on 2026-09-07 and its source was verified on ArcScan. The deployment workflow then submitted a second transaction that recorded a live Arc network observation onchain.

- Contract: `0xB5Cb71b80Bd37b6e7F6B0a86bce21A105B1e1466`
- ArcScan contract: https://testnet.arcscan.app/address/0xB5Cb71b80Bd37b6e7F6B0a86bce21A105B1e1466
- Deployment transaction: https://testnet.arcscan.app/tx/0x110ead4ce0ddaef168c3a0d77cf75cbab839df52e7080632ed99dce731c301c8
- Observation transaction: https://testnet.arcscan.app/tx/0x13a54c7625dc40f8fbb70f1ec5b45c482ae16f2376fef5cb25fdec96e6295d26
- Observed block: `60971174`
- ArcScan source verification: **passed**
- Continuous verification: https://github.com/aarin081/transaction-observe/actions/workflows/ci.yml

## Project layout

```text
contracts/ArcObservationRegistry.sol  onchain observation registry
src/health.ts                         live Arc RPC and USDC checks
src/receipt.ts                        transaction receipt inspection
scripts/deploy.mjs                    guarded Arc Testnet deployment
scripts/verify.mjs                    ArcScan source verification
scripts/check-deployment.mjs          public onchain evidence re-check
docs/deployment.json                  public deployment facts
test/                                 unit and contract compilation tests
.github/workflows/                     CI and manual deployment automation
```

## Quick start

```bash
npm install
npm run build
npm test
npm run health
npm run evidence
```

Optional custom RPC:

```bash
ARC_RPC_URL=https://rpc.testnet.arc.io npm run health
```

## Arc references

- Arc RPC endpoints: https://docs.arc.io/arc/references/rpc-endpoints
- Arc gas and fees: https://docs.arc.io/arc/references/gas-and-fees
- Arc deploy tutorial: https://docs.arc.io/arc/tutorials/deploy-on-arc

## Security

No wallet file, seed phrase, or private key is committed to this repository. `.env` files and common key-file patterns are ignored by Git. The deployment script checks the Arc Testnet chain ID before signing. Deployment is manual-only and reads `ARC_PRIVATE_KEY` from GitHub Actions repository secrets.

## Roadmap

- add block-stream and latency sampling over longer windows
- decode registry events in the receipt tooling
- add fixture-based receipt and revert-path tests
- expand the observer into reusable Arc transaction diagnostics

## License

MIT
