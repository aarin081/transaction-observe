import assert from "node:assert/strict";
import test from "node:test";
import { recommendedMaxFeeWei } from "../src/fees.js";
import {
  erc20UsdcFromMinor,
  formatUnits,
  nativeUsdcFromWei,
  weiToGwei,
} from "../src/units.js";

test("formats Arc native USDC with 18 decimals", () => {
  assert.equal(nativeUsdcFromWei(1_250_000_000_000_000_000n), "1.25");
});

test("formats Arc ERC-20 USDC with 6 decimals", () => {
  assert.equal(erc20UsdcFromMinor(1_250_000n), "1.25");
});

test("keeps the documented 20 gwei max-fee floor", () => {
  const result = recommendedMaxFeeWei(2_000_000_000n);
  assert.equal(weiToGwei(result), "20");
});

test("raises max fee when twice observed gas exceeds the floor", () => {
  const result = recommendedMaxFeeWei(15_000_000_000n);
  assert.equal(weiToGwei(result), "30");
});

test("formatUnits removes trailing zeroes", () => {
  assert.equal(formatUnits(12_340_000n, 6), "12.34");
});
