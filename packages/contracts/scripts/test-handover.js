import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

const RPC_URL = "https://sepolia.base.org";
const HANDOVER_ADDRESS = "0x41EfECDB514c78cE5A7eF022A930fBAD6919Dcd6";
const TOKEN_ADDRESS = "0x405A5bAF6a66319de62ab6A86058dB4829F7487e";

const W1_KEY = process.env.WALLET_1_PRIVATE_KEY; // Proposer
const W2_KEY = process.env.WALLET_2_PRIVATE_KEY; // Client
const W3_KEY = process.env.WALLET_3_PRIVATE_KEY; // Evaluator

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const proposer = new ethers.Wallet(W1_KEY, provider);
  const client = new ethers.Wallet(W2_KEY, provider);
  const evaluator = new ethers.Wallet(W3_KEY, provider);

  const handoverAbi = [
    "function createJob(address, address, uint256, string, address) external returns (uint256)",
    "function setBudget(uint256, uint256, bytes) external",
    "function fund(uint256, uint256, bytes) external",
    "function submit(uint256, bytes32, bytes) external",
    "function complete(uint256, bytes32, bytes) external",
    "function nextJobId() external view returns (uint256)"
  ];
  const erc20Abi = [
    "function approve(address, uint256) returns (bool)", 
    "function allowance(address, address) view returns (uint256)",
    "function balanceOf(address) view returns (uint256)", 
    "function decimals() view returns (uint8)"
  ];

  const handover = new ethers.Contract(HANDOVER_ADDRESS, handoverAbi, provider);
  const token = new ethers.Contract(TOKEN_ADDRESS, erc20Abi, provider);
  const decimals = await token.decimals();
  const amount = ethers.parseUnits("10", decimals);

  console.log("--- Starting FINAL E2E Test ---");

  // Create Job
  const jobId = await handover.nextJobId();
  console.log(`Step 1: Creating Job ${jobId}...`);
  await (await handover.connect(client).createJob(proposer.address, evaluator.address, Math.floor(Date.now()/1000)+3600, "Final Test", ethers.ZeroAddress)).wait();
  
  await sleep(3000);

  // Set Budget
  console.log("Step 2: Setting Budget...");
  await (await handover.connect(client).setBudget(jobId, amount, "0x")).wait();

  await sleep(3000);

  // Approve
  console.log("Step 3: Approving...");
  const approveTx = await token.connect(client).approve(HANDOVER_ADDRESS, amount);
  await approveTx.wait();
  
  // WAIT AND VERIFY ALLOWANCE
  console.log("Waiting for allowance to propagate...");
  await sleep(5000);
  const allowance = await token.allowance(client.address, HANDOVER_ADDRESS);
  console.log(`Allowance: ${ethers.formatUnits(allowance, decimals)} pUSDC`);

  if (allowance < amount) {
    throw new Error("Allowance too low after approval!");
  }

  // Fund
  console.log("Step 4: Funding...");
  await (await handover.connect(client).fund(jobId, amount, "0x")).wait();
  console.log("Job Funded!");

  await sleep(3000);

  // Submit
  console.log("Step 5: Submitting fix...");
  const fixHash = ethers.keccak256(ethers.toUtf8Bytes("Ready"));
  await (await handover.connect(proposer).submit(jobId, fixHash, "0x")).wait();

  await sleep(3000);

  // Complete
  console.log("Step 6: Completing...");
  await (await handover.connect(evaluator).complete(jobId, ethers.keccak256(ethers.toUtf8Bytes("Done")), "0x")).wait();

  const proposerFinal = await token.balanceOf(proposer.address);
  console.log(`\nFinal Proposer Balance: ${ethers.formatUnits(proposerFinal, decimals)} pUSDC`);
  console.log("--- FINAL E2E SUCCESS! ---");
}

main().catch(console.error);
