import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

const RPC_URL = "https://sepolia.base.org";
const HANDOVER_ADDRESS = "0xD1A10951dF06E9Fe21eCe73189D5C630754De3fa";
const W2_KEY = process.env.WALLET_2_PRIVATE_KEY; // Client

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const client = new ethers.Wallet(W2_KEY, provider);

  const handoverAbi = [
    "function jobs(uint256) external view returns (address client, address provider, address evaluator, uint256 budget, uint256 expiredAt, bytes32 deliverable, uint8 state, string description, address hook)",
    "function nextJobId() external view returns (uint256)"
  ];

  const handover = new ethers.Contract(HANDOVER_ADDRESS, handoverAbi, provider);

  const nextId = await handover.nextJobId();
  console.log(`Next Job ID: ${nextId}`);

  for (let i = 0; i < nextId; i++) {
    const job = await handover.jobs(i);
    console.log(`Job ${i}:`);
    console.log(`  Client:   ${job.client}`);
    console.log(`  Provider: ${job.provider}`);
    console.log(`  State:    ${job.state}`);
  }

  console.log(`\nYour Wallet Address: ${client.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
