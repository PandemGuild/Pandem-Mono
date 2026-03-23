import { createWalletClient, createPublicClient, http, parseUnits, keccak256, stringToHex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { HANDOVER_CONTRACT_ADDRESS, IACP_ABI } from "../config/contracts";
import * as dotenv from "dotenv";

dotenv.config();

const API_URL = "http://localhost:3001";
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

  console.log("--- STARTING MASTER E2E PROTOCOL TEST ---");

  // 1. API: Create Smart Order
  console.log("\n[STEP 1] Agent creating Smart Order via API...");
  const orderRes = await fetch(`${API_URL}/api/orders/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      job: {
        description: "Verify critical security fix for Pandem-Core Buffer Overflow.",
        budget: "10",
        provider: proposer.account.address,
        evaluator: EVALUATOR_ADDR,
        expiry: Math.floor(Date.now() / 1000) + 3600
      }
    })
  });
  const { orderId } = await orderRes.json();
  console.log(`🟢 Order Created! ID: ${orderId}`);

  await sleep(2000);

  // 2. ON-CHAIN: Create Job
  console.log("\n[STEP 2] Simulating Client creating Job on Base Sepolia...");
  const hash1 = await client.writeContract({
    address: HANDOVER_CONTRACT_ADDRESS as `0x${string}`,
    abi: IACP_ABI,
    functionName: "createJob",
    args: [proposer.account.address, EVALUATOR_ADDR, BigInt(Math.floor(Date.now()/1000) + 3600), "Bug Fix #101", "0x0000000000000000000000000000000000000000"],
  });
  const receipt1 = await publicClient.waitForTransactionReceipt({ hash: hash1 });
  const jobId = BigInt(receipt1.logs[0].topics[1]!);
  console.log(`🟢 Job #${jobId} is LIVE on-chain.`);

  await sleep(10000); // 10s delay

  // 3. API: Link Job to Order
  console.log("\n[STEP 3] Linking On-Chain Job to the Smart Order...");
  await fetch(`${API_URL}/api/orders/${orderId}/link`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jobId: jobId.toString() })
  });
  console.log("🟢 Link Successful.");

  await sleep(5000);

  // 4. ON-CHAIN: Payment (Funding)
  const amount = parseUnits("10", 6);
  console.log(`\n[STEP 4] Client performing PAYMENT (Funding Job #${jobId})...`);
  
  const hash3 = await client.writeContract({
    address: TOKEN_ADDRESS as `0x${string}`,
    abi: [{ name: "approve", type: "function", inputs: [{ name: "s", type: "address" }, { name: "a", type: "uint256" }], outputs: [] }],
    functionName: "approve",
    args: [HANDOVER_CONTRACT_ADDRESS as `0x${string}`, amount],
  });
  await publicClient.waitForTransactionReceipt({ hash: hash3 });
  
  await sleep(10000); // 10s delay

  const hash4 = await client.writeContract({
    address: HANDOVER_CONTRACT_ADDRESS as `0x${string}`,
    abi: IACP_ABI,
    functionName: "fund",
    args: [jobId, amount, "0x"],
  });
  await publicClient.waitForTransactionReceipt({ hash: hash4 });
  console.log("🟢 Payment Completed! Escrow is funded.");

  await sleep(10000); // 10s delay

  // 5. ON-CHAIN: Proposer Submission
  console.log("\n[STEP 5] Proposer submitting fix hash...");
  const fixHash = keccak256(stringToHex("VERIFIED_BY_AGENT"));
  const hash5 = await proposer.writeContract({
    address: HANDOVER_CONTRACT_ADDRESS as `0x${string}`,
    abi: IACP_ABI,
    functionName: "submit",
    args: [jobId, fixHash, "0x"],
  });
  await publicClient.waitForTransactionReceipt({ hash: hash5 });
  console.log("🟢 Work Submitted.");

  console.log("\n--- FLOW TRIGGERED ---");
  console.log(`Monitor Job #${jobId} settlement in backend logs.`);
}

main().catch(console.error);
