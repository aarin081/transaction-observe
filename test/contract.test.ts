import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import solc from "solc";

const sourcePath = "contracts/ArcObservationRegistry.sol";
const contractName = "ArcObservationRegistry";

function compileRegistry() {
  const source = fs.readFileSync(sourcePath, "utf8");
  const input = {
    language: "Solidity",
    sources: { [sourcePath]: { content: source } },
    settings: {
      optimizer: { enabled: false, runs: 200 },
      evmVersion: "paris",
      outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } },
    },
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  const errors = (output.errors ?? []).filter(
    (item: { severity: string }) => item.severity === "error",
  );
  assert.deepEqual(errors, []);
  return output.contracts[sourcePath][contractName];
}

test("ArcObservationRegistry compiles to deployable bytecode", () => {
  const artifact = compileRegistry();
  assert.ok(artifact.evm.bytecode.object.length > 0);
});

test("ArcObservationRegistry exposes the observation interface", () => {
  const artifact = compileRegistry();
  const names = artifact.abi.map((item: { name?: string }) => item.name).filter(Boolean);
  assert.ok(names.includes("recordObservation"));
  assert.ok(names.includes("latestObservation"));
  assert.ok(names.includes("owner"));
  assert.ok(names.includes("ObservationRecorded"));
});
