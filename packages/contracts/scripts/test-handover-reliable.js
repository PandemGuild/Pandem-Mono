import { ethers } from "ethers";
import * as dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

const RPC_URL = "https://sepolia.base.org";
const HANDOVER_ADDRESS = "0xF2436d6E98EbD303965C3Ef595C3a01B2561a6A4";
const TOKEN_ADDRESS = "0x405A5bAF6a66319de62ab6A86058dB4829F7487e";

const W1_KEY = process.env.WALLET_1_PRIVATE_KEY; // Proposer
const W2_KEY = process.env.WALLET_2_PRIVATE_KEY; // Client
const W3_KEY = process.env.WALLET_3_PRIVATE_KEY; // Evaluator

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function encrypt(text, key) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(key), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

function decrypt(text, key) {
  const textParts = text.split(":");
  const iv = Buffer.from(textParts.shift(), "hex");
  const encryptedText = Buffer.from(textParts.join(":"), "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(key), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const proposer = new ethers.Wallet(W1_KEY, provider);
  const client = new ethers.Wallet(W2_KEY, provider);
  const evaluator = new ethers.Wallet(W3_KEY, provider);

  console.log("--- STARTING SCENARIO: ATOMIC HANDOVER (Evaluator-Gated) ---");
  console.log("Project: Pandem (Base Sepolia)");
  console.log("------------------------------------------------------------\n");

  const handoverAbi = [
    "function createJob(address, address, uint256, string, address) external returns (uint256)",
    "function setBudget(uint256, uint256, bytes) external",
    "function fund(uint256, uint256, bytes) external",
    "function submit(uint256, bytes32, bytes) external",
    "function complete(uint256, bytes32, bytes) external",
    "function jobs(uint256) external view returns (address client, address provider, address evaluator, uint256 budget, uint256 expiredAt, bytes32 deliverable, uint8 status, string description, address hook)",
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
  const amount = ethers.parseUnits("10", decimals); // Using 10 units for testing

  let clientNonce = await client.getNonce();
  let proposerNonce = await proposer.getNonce();
  let evaluatorNonce = await evaluator.getNonce();

  // 1. CREATE JOB
  const jobId = await handover.nextJobId();
  console.log(`Step 1: Client creating Job ${jobId}...`);
  await (await handover.connect(client).createJob(proposer.address, evaluator.address, Math.floor(Date.now()/1000)+3600, "Reliable Handover Test", ethers.ZeroAddress, { nonce: clientNonce++ })).wait();
  console.log("🟢 Job Created.\n");

  await sleep(2000);

  // 2. ENCRYPT DATA
  console.log("Step 2: Proposer encrypting fix locally...");
  const fixUrl = "https://github.com/PandemGuild/SecretFix/archive/v1.0.zip";
  const secretKey = crypto.randomBytes(32); 
  const encryptedFix = encrypt(fixUrl, secretKey);
  console.log("🟢 Local encryption complete.\n");

  // 3. SET BUDGET & APPROVE
  console.log("Step 3: Negotiating and Approving...");
  await (await handover.connect(client).setBudget(jobId, amount, "0x", { nonce: clientNonce++ })).wait();
  await sleep(2000);
  await (await token.connect(client).approve(HANDOVER_ADDRESS, amount, { nonce: clientNonce++ })).wait();
  console.log("🟢 Budget set and Token approved.\n");

  await sleep(2000);

  // DEBUG CHECK
  const balance = await token.balanceOf(client.address);
  const allowance = await token.allowance(client.address, HANDOVER_ADDRESS);
  console.log(`Debug: Balance=${ethers.formatUnits(balance, decimals)}, Allowance=${ethers.formatUnits(allowance, decimals)}\n`);

  // 4. FUND
  console.log("Step 4: Client funding Job...");
  await (await handover.connect(client).fund(jobId, amount, "0x", { nonce: clientNonce++ })).wait();
  console.log("🟢 Job Funded on Base Sepolia.\n");

  await sleep(2000);

  // 5. SUBMIT
  console.log("Step 5: Proposer submitting deliverable hash...");
  const fixHash = ethers.keccak256(ethers.toUtf8Bytes(fixUrl));
  await (await handover.connect(proposer).submit(jobId, fixHash, "0x", { nonce: proposerNonce++ })).wait();
  
  // Handoff key to Evaluator (Simulated)
  const evaluatorKeyStore = new Map();
  evaluatorKeyStore.set(jobId.toString(), secretKey);
  console.log("🟢 Submitted. Evaluator now has the key.\n");

  await sleep(2000);

  // 6. ATOMIC GATE
  const requestDecryption = async (id, requester) => {
    const job = await handover.jobs(id);
    if (job.status !== 3n) throw new Error("Job not completed.");
    return evaluatorKeyStore.get(id.toString());
  };

  // 7. SETTLEMENT
  console.log("Step 7: Evaluator completing Job...");
  await (await handover.connect(evaluator).complete(jobId, ethers.keccak256(ethers.toUtf8Bytes("Verified")), "0x", { nonce: evaluatorNonce++ })).wait();
  console.log("🟢 Job status updated to COMPLETED.\n");

  await sleep(3000);

  // 8. FINAL HANDOVER
  console.log("Step 8: Client requesting key...");
  const key = await requestDecryption(jobId, client);
  const result = decrypt(encryptedFix, key);
  console.log(`🟢 SUCCESS: Decrypted URL: ${result}`);
  console.log("\n--- SCENARIO COMPLETE ---");
}

main().catch(console.error);
