import fs from "node:fs";
import solc from "solc";

const API_URL = "https://testnet.arcscan.app/api";
const deployment = JSON.parse(fs.readFileSync("deployment.json", "utf8"));
const standardInput = fs.readFileSync("standard-input.json", "utf8").trim();
const compilerVersion = `v${solc.version().split(".Emscripten")[0]}`;

const params = new URLSearchParams({
  module: "contract",
  action: "verifysourcecode",
  codeformat: "solidity-standard-json-input",
  contractaddress: deployment.contractAddress,
  contractname: "contracts/ArcObservationRegistry.sol:ArcObservationRegistry",
  compilerversion: compilerVersion,
  sourceCode: standardInput,
  licenseType: "3",
});

const response = await fetch(API_URL, {
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded" },
  body: params,
});

if (!response.ok) {
  throw new Error(`ArcScan verification HTTP ${response.status}`);
}

const submission = await response.json();
console.log("Verification submission:", submission);

const submissionText = JSON.stringify(submission).toLowerCase();
if (submissionText.includes("already verified")) {
  console.log("Contract is already verified on ArcScan.");
  process.exit(0);
}

if (submission.status !== "1") {
  throw new Error(`Verification submission failed: ${JSON.stringify(submission)}`);
}

const guid = submission.result;
for (let attempt = 1; attempt <= 18; attempt += 1) {
  await new Promise((resolve) => setTimeout(resolve, 5_000));
  const url = new URL(API_URL);
  url.searchParams.set("module", "contract");
  url.searchParams.set("action", "checkverifystatus");
  url.searchParams.set("guid", guid);

  const statusResponse = await fetch(url);
  const status = await statusResponse.json();
  console.log(`Verification check ${attempt}:`, status);

  const text = JSON.stringify(status).toLowerCase();
  if (status.status === "1" || text.includes("pass - verified")) {
    console.log(`Verified: ${deployment.explorerContractUrl}?tab=contract`);
    process.exit(0);
  }
  if (
    text.includes("fail") ||
    text.includes("unable to verify") ||
    text.includes("error")
  ) {
    throw new Error(`ArcScan verification failed: ${JSON.stringify(status)}`);
  }
}

throw new Error("ArcScan verification did not finish within the polling window");
