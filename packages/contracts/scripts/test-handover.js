import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

const RPC_URL = "https://sepolia.base.org";
const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
const HANDOVER_ADDRESS = "0x54998a35fbCb1EC8583890467A8b31F1ce16efDd";

const W1_KEY = process.env.WALLET_1_PRIVATE_KEY; // Proposer
const W2_KEY = process.env.WALLET_2_PRIVATE_KEY; // Client
const W3_KEY = process.env.WALLET_3_PRIVATE_KEY; // Evaluator

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const proposer = new ethers.Wallet(W1_KEY, provider);
  const client = new ethers.Wallet(W2_KEY, provider);
  const evaluator = new ethers.Wallet(W3_KEY, provider);

  const handoverAbi = [
    "event JobCreated(uint256 indexed jobId, address indexed client, address indexed provider, address evaluator, uint256 expiredAt, address hook)",
    "function createJob(address, address, uint256, string, address) external returns (uint256)",
    "function setBudget(uint256, uint256, bytes) external",
    "function fund(uint256, bytes) external",
    "function submit(uint256, bytes32, bytes) external",
    "function complete(uint256, bytes32, bytes) external",
    "function getJob(uint256) external view returns (tuple(address client, address provider, address evaluator, uint256 budget, uint256 expiredAt, bytes32 deliverable, uint8 state, string description, address hook))"
  ];
  const usdcAbi = ["function approve(address, uint256) returns (bool)", "function balanceOf(address) view returns (uint256)", "function decimals() view returns (uint8)"];

  const handover = new ethers.Contract(HANDOVER_ADDRESS, handoverAbi, provider);
  const usdc = new ethers.Contract(USDC_ADDRESS, usdcAbi, provider);
  const decimals = await usdc.decimals();
  const amount = ethers.parseUnits("1", decimals);

  console.log("--- Starting E2E Handover Test ---");

  let proposerNonce = await proposer.getNonce();
  let clientNonce = await client.getNonce();
  let evaluatorNonce = await evaluator.getNonce();

  // Step 1: Client creates Job
  console.log("Step 1: Client creating Job...");
  const createTx = await handover.connect(client).createJob(
    proposer.address,
    evaluator.address,
    Math.floor(Date.now() / 1000) + 3600,
    "Test Bug Fix",
    ethers.ZeroAddress,
    { nonce: clientNonce++ }
  );
  const receipt = await createTx.wait();
  
  const log = receipt.logs.find(l => l.topics[0] === ethers.id("JobCreated(uint256,address,address,address,uint256,address)"));
  const jobId = ethers.toBigInt(log.topics[1]);
  console.log(`Job Created! ID: ${jobId}`);

  // Debug: Read Job Data
  const job = await handover.getJob(jobId);
  console.log(`Job Client:   ${job.client}`);
  console.log(`Job Provider: ${job.provider}`);
  console.log(`Wallet Client:   ${client.address}`);
  console.log(`Wallet Proposer: ${proposer.address}`);

  // Step 2: Set Budget
  console.log("\nStep 2: Client setting budget to 1 USDC...");
  const budgetTx = await handover.connect(client).setBudget(jobId, amount, "0x", { nonce: clientNonce++ });
  await budgetTx.wait();

  // Step 3: Client approves & funds
  console.log("\nStep 3: Client approving & funding...");
  const approveTx = await usdc.connect(client).approve(HANDOVER_ADDRESS, amount, { nonce: clientNonce++ });
  await approveTx.wait();
  const fundTx = await handover.connect(client).fund(jobId, "0x", { nonce: clientNonce++ });
  await fundTx.wait();
  console.log("Job Funded!");

  // Step 4: Proposer submits fix
  console.log("\nStep 4: Proposer submitting fix hash...");
  const dummyHash = ethers.keccak256(ethers.toUtf8Bytes("The fix is in the repo"));
  const submitTx = await handover.connect(proposer).submit(jobId, dummyHash, "0x", { nonce: proposerNonce++ });
  await submitTx.wait();

  // Step 5: Evaluator completes
  console.log("\nStep 5: Evaluator completing job...");
  const completeTx = await handover.connect(evaluator).complete(jobId, ethers.keccak256(ethers.toUtf8Bytes("Fix verified")), "0x", { nonce: evaluatorNonce++ });
  await completeTx.wait();
  console.log("Job Completed!");

  // Step 6: Verify final balance
  const proposerFinal = await usdc.balanceOf(proposer.address);
  console.log(`Final Proposer Balance: ${ethers.formatUnits(proposerFinal, decimals)} USDC`);
  console.log("--- E2E Test Success! ---");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
