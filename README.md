# Arc Transaction Observer

[![Arc observer CI](https://github.com/aarin081/transaction-observe/actions/workflows/ci.yml/badge.svg)](https://github.com/aarin081/transaction-observe/actions/workflows/ci.yml)

A developer tool for inspecting **Arc Testnet** transaction infrastructure in real time.

It checks the Arc RPC, validates the chain ID, reports the latest block and gas conditions, verifies Arc's USDC ERC-20 interface, and tracks confirmed transaction receipts. It also makes Arc's USDC accounting model explicit: **native USDC uses 18-decimal EVM units for gas/value math, while the ERC-20 interface uses 6 decimals for token balances and transfers**.

The core observer is read-only. An optional deployment workflow uses a GitHub Actions secret to deploy and verify a small observation registry on Arc Testnet.

## Why this exists

Arc is EVM-compatible, but its USDC-native design introduces details that infrastructure and application developers need to handle correctly:

- Arc Testnet chain ID: `5042002`
- Primary RPC: `https://rpc.testnet.arc.io`
- USDC is the native gas asset
- Native value/gas math uses 18-decimal units
- The USDC ERC-20 interface uses 6 decimals
- Arc Testnet enforces a 20 gwei minimum base fee

The goal is to turn those assumptions into executable checks instead of leaving them as documentation-only knowledge.

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

### Tests and CI

`npm test` verifies the unit-conversion and fee-floor logic locally. GitHub Actions runs typechecking, all unit tests, and a live Arc Testnet RPC check on pushes and pull requests.

## Verified Arc Testnet deployment

`ArcObservationRegistry` was deployed and verified on Arc Testnet on 2026-09-07. The deployment workflow also recorded a live network observation onchain after deployment.

- Contract: `0xB5Cb71b80Bd37b6e7F6B0a86bce21A105B1e1466`
- ArcScan contract: https://testnet.arcscan.app/address/0xB5Cb71b80Bd37b6e7F6B0a86bce21A105B1e1466
- Deployment transaction: https://testnet.arcscan.app/tx/0x110ead4ce0ddaef168c3a0d77cf75cbab839df52e7080632ed99dce731c301c8
- Observation transaction: https://testnet.arcscan.app/tx/0x13a54c7625dc40f8fbb70f1ec5b45c482ae16f2376fef5cb25fdec96e6295d26
- Observed block: `60971174`
- ArcScan source verification: **passed**
- Deployment workflow evidence: https://github.com/aarin081/transaction-observe/actions/runs/34163526310

The deployment and observation transaction steps both succeeded, and ArcScan returned `Pass - Verified` for the contract source.

## Verified live RPC run

The first CI run on this repository completed successfully on 2026-09-07. It:

- passed TypeScript typechecking
- passed all 5 unit tests
- connected to `https://rpc.testnet.arc.io`
- verified chain ID `5042002`
- queried a live Arc block
- observed live gas pricing
- verified the Arc USDC system contract reports 6 ERC-20 decimals

CI evidence: https://github.com/aarin081/transaction-observe/actions/runs/34156914316

## Quick start

```bash
npm install
npm run build
npm test
npm run health
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

No wallet file, seed phrase, or private key is committed to this repository. `.env` files and common key-file patterns are ignored by Git. The optional deployment workflow reads `ARC_PRIVATE_KEY` only from GitHub Actions repository secrets.

## Roadmap

- add a block-stream/latency sampler
- add fixture-based receipt tests
- expand receipt and event decoding around the deployed registry
