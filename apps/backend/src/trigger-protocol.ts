import { createWalletClient, createPublicClient, http, parseUnits, keccak256, stringToHex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { HANDOVER_CONTRACT_ADDRESS, IACP_ABI } from "../config/contracts";
import { VaultManager } from "./vault/manager";
import { StrategyGenerator } from "./creator/strategy-generator";
import * as dotenv from "dotenv";

dotenv.config();

const RPC_URL = process.env.RPC_URL!;
const TOKEN_ADDRESS = "0x405A5bAF6a66319de62ab6A86058dB4829F7487e";

const W1_KEY = "0xffea1b19b8d82a06f12100e57a0310a4a370eb06d332f346b86717ce0d982be7" as `0x${string}`;
const W2_KEY = "0x45a3622b687cfc4ee875636d2087d5b61e13174ce1901bbf3dac0ab50190e8f3" as `0x${string}`;
const EVALUATOR_ADDR = "0x08c3e48c9e7bc28b9e4258e282c43618EF7D50E5";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const publicClient = createPublicClient({ chain: baseSepolia, transport: http(RPC_URL) });
  const proposer = createWalletClient({ account: privateKeyToAccount(W1_KEY), chain: baseSepolia, transport: http(RPC_URL) });
  const client = createWalletClient({ account: privateKeyToAccount(W2_KEY), chain: baseSepolia, transport: http(RPC_URL) });

  const vault = new VaultManager();
  const creator = new StrategyGenerator();

  console.log("--- ATOMIC HANDOVER: STEP 1 (TRIGGER) ---");

  // 1. CREATE JOB
  console.log("1. Client (W2) creating Job on-chain...");
  const hash1 = await client.writeContract({
    address: HANDOVER_CONTRACT_ADDRESS as `0x${string}`,
    abi: IACP_ABI,
    functionName: "createJob",
    args: [proposer.account.address, EVALUATOR_ADDR, BigInt(Math.floor(Date.now()/1000) + 3600), "Security Fix for Pandem-Core Buffer Overflow", "0x0000000000000000000000000000000000000000"],
  });
  const receipt1 = await publicClient.waitForTransactionReceipt({ hash: hash1 });
  const jobId = BigInt(receipt1.logs[0].topics[1]!);
  console.log(`🟢 Job #${jobId} Created.`);

  await sleep(5000);

  // 2. ARCHITECT RUBRIC
  console.log("\n2. AI Architect generating hidden rubric...");
  const strategy = await creator.generate("Verify fix for Pandem-Core: Ensure all buffer copies use bounded lengths and strncpy.");
  await vault.saveStrategy(jobId, strategy.rubric, strategy.caseType);
  console.log("🟢 Strategy saved to Vault.");

  // 3. SET BUDGET
  const amount = parseUnits("10", 6);
  console.log(`\n3. Client (W2) setting budget to 10 pUSDC...`);
  const hash2 = await client.writeContract({
    address: HANDOVER_CONTRACT_ADDRESS as `0x${string}`,
    abi: IACP_ABI,
    functionName: "setBudget",
    args: [jobId, amount, "0x"],
  });
  await publicClient.waitForTransactionReceipt({ hash: hash2 });
  console.log("🟢 Budget Set.");

  await sleep(5000);

  // 4. APPROVE & FUND
  console.log("\n4. Client (W2) approving and funding...");
  const hash3 = await client.writeContract({
    address: TOKEN_ADDRESS as `0x${string}`,
    abi: [{ name: "approve", type: "function", inputs: [{ name: "s", type: "address" }, { name: "a", type: "uint256" }], outputs: [] }],
    functionName: "approve",
    args: [HANDOVER_CONTRACT_ADDRESS as `0x${string}`, amount],
  });
  await publicClient.waitForTransactionReceipt({ hash: hash3 });
  
  await sleep(5000);

  const hash4 = await client.writeContract({
    address: HANDOVER_CONTRACT_ADDRESS as `0x${string}`,
    abi: IACP_ABI,
    functionName: "fund",
    args: [jobId, amount, "0x"],
  });
  await publicClient.waitForTransactionReceipt({ hash: hash4 });
  console.log("🟢 Escrow Funded by Client.");

  await sleep(5000);

  // 5. SUBMIT
  console.log("\n5. Proposer (W1) submitting fix hash...");
  const fixHash = keccak256(stringToHex("The PR is ready for merge"));
  const hash5 = await proposer.writeContract({
    address: HANDOVER_CONTRACT_ADDRESS as `0x${string}`,
    abi: IACP_ABI,
    functionName: "submit",
    args: [jobId, fixHash, "0x"],
  });
  await publicClient.waitForTransactionReceipt({ hash: hash5 });
  console.log("🟢 Work Submitted.");

  console.log(`\n--- TRIGGER COMPLETE FOR JOB ${jobId} ---`);
}

main().catch(console.error);
