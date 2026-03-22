import { ethers } from "ethers";
import * as dotenv from "dotenv";
import { LitNodeClient } from "@lit-protocol/lit-node-client";
import { LIT_NETWORK, LIT_RPC } from "@lit-protocol/constants";
import pkg from "@lit-protocol/auth-helpers";
const {
  createSiweMessageWithRecaps,
  generateAuthSig,
  LitActionResource,
  LitAccessControlConditionResource,
} = pkg;

dotenv.config();

const RPC_URL = "https://sepolia.base.org";
const HANDOVER_ADDRESS = "0xA96e0a8Aa5F4C855ADF8F2a588626d0dc9732C69";
const TOKEN_ADDRESS = "0x405A5bAF6a66319de62ab6A86058dB4829F7487e";

const W1_KEY = process.env.WALLET_1_PRIVATE_KEY; // Proposer (Provider)
const W2_KEY = process.env.WALLET_2_PRIVATE_KEY; // Client
const W3_KEY = process.env.WALLET_3_PRIVATE_KEY; // Evaluator

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const proposer = new ethers.Wallet(W1_KEY, provider);
  const client = new ethers.Wallet(W2_KEY, provider);
  const evaluator = new ethers.Wallet(W3_KEY, provider);

  console.log("--- STARTING SCENARIO: ATOMIC SECURITY FIX HANDOVER ---");
  console.log("Project: Pandem (Base Sepolia + Lit Protocol)");
  console.log("-------------------------------------------------------\n");

  // 1. INITIALIZE LIT CLIENT
  console.log("Step 1: Connecting to Lit Protocol (Datil-Dev)...");
  const litClient = new LitNodeClient({
    litNetwork: "datil-dev", // Fixed: Use 'datil-dev' for potentially better availability
    debug: false,
  });
  await litClient.connect();
  console.log("🟢 Connected to Lit Network.\n");

  // 2. CREATE JOB ON-CHAIN
  const handoverAbi = [
    "function createJob(address, address, uint256, string, address) external returns (uint256)",
    "function setBudget(uint256, uint256, bytes) external",
    "function fund(uint256, uint256, bytes) external",
    "function submit(uint256, bytes32, bytes) external",
    "function complete(uint256, bytes32, bytes) external",
    "function nextJobId() external view returns (uint256)"
  ];
  const handover = new ethers.Contract(HANDOVER_ADDRESS, handoverAbi, provider);
  
  const jobId = await handover.nextJobId();
  console.log(`Step 2: Client creating Job ${jobId} for 'Zero-Day Fix for Pandem-Core'...`);
  const createTx = await handover.connect(client).createJob(
    proposer.address,
    evaluator.address,
    Math.floor(Date.now() / 1000) + 3600,
    "Fix for CVE-2026-ATOMIC",
    ethers.ZeroAddress
  );
  await createTx.wait();
  console.log(`🟢 Job ${jobId} created on Base Sepolia.\n`);

  // 3. ENCRYPT DATA (The "Fix")
  console.log("Step 3: Proposer encrypting the Fix URL...");
  const fixUrl = "https://github.com/PandemGuild/SecretFix/archive/v1.0.zip";
  
  const accessControlConditions = [
    {
      contractAddress: HANDOVER_ADDRESS,
      standardContractType: "",
      chain: "baseSepolia",
      method: "jobs",
      parameters: [jobId.toString()],
      returnValueTest: {
        comparator: "==",
        value: "3", // status: Completed
      },
    },
    { operator: "and" },
    {
      contractAddress: "",
      standardContractType: "",
      chain: "baseSepolia",
      method: "",
      parameters: [":userAddress"],
      returnValueTest: {
        comparator: "==",
        value: client.address,
      },
    }
  ];

  const { ciphertext, dataToEncryptHash } = await litClient.encrypt({
    accessControlConditions,
    dataToEncrypt: new TextEncoder().encode(fixUrl),
  });
  console.log(`🟢 Fix encrypted. Hash: ${dataToEncryptHash.substring(0, 20)}...`);
  console.log("   (This URL is now cryptographically locked until payment settles)\n");

  // 4. PROGRESS JOB
  console.log("Step 4: Proposer setting budget and Client funding...");
  const budgetTx = await handover.connect(client).setBudget(jobId, ethers.parseUnits("1", 6), "0x");
  await budgetTx.wait();
  
  const erc20 = new ethers.Contract(TOKEN_ADDRESS, ["function approve(address, uint256) returns (bool)"], client);
  await (await erc20.approve(HANDOVER_ADDRESS, ethers.parseUnits("1", 6))).wait();
  
  const fundTx = await handover.connect(client).fund(jobId, ethers.parseUnits("1", 6), "0x");
  await fundTx.wait();
  console.log("🟢 Job Funded. Escrow holds 1 pUSDC.\n");

  // 5. PROPOSER SUBMITS
  console.log("Step 5: Proposer submitting the fix hash...");
  const submitTx = await handover.connect(proposer).submit(jobId, ethers.keccak256(ethers.toUtf8Bytes(fixUrl)), "0x");
  await submitTx.wait();
  console.log("🟢 Deliverable submitted.\n");

  // 6. ATTEMPT EARLY DECRYPTION (Should Fail)
  console.log("Step 6: Client attempting early decryption (before completion)...");
  try {
    const authSig = await generateAuthSig({
      signer: client,
      client: litClient,
      toSign: await createSiweMessageWithRecaps({
        uri: "http://localhost:3000",
        expiration: new Date(Date.now() + 1000 * 60 * 10).toISOString(),
        walletAddress: client.address,
        nonce: await litClient.getLatestBlockhash(),
        resources: [{
          resource: new LitAccessControlConditionResource("*"),
          ability: "access-control-condition-decryption",
        }],
      }),
    });

    await litClient.decrypt({
      accessControlConditions,
      ciphertext,
      dataToEncryptHash,
      authSig,
      chain: "baseSepolia",
    });
    console.log("❌ ERROR: Decryption succeeded too early!");
  } catch (err) {
    console.log("🟢 SUCCESS: Decryption failed as expected (Condition not met).\n");
  }

  // 7. EVALUATOR COMPLETES
  console.log("Step 7: Evaluator verifying fix and completing Job...");
  const completeTx = await handover.connect(evaluator).complete(jobId, ethers.keccak256(ethers.toUtf8Bytes("Verified")), "0x");
  await completeTx.wait();
  console.log("🟢 Job status updated to COMPLETED. Funds released to Proposer.\n");

  await sleep(5000); // Wait for Lit nodes to sync state

  // 8. FINAL ATOMIC HANDOVER
  console.log("Step 8: Client attempting final decryption...");
  const finalAuthSig = await generateAuthSig({
    signer: client,
    client: litClient,
    toSign: await createSiweMessageWithRecaps({
      uri: "http://localhost:3000",
      expiration: new Date(Date.now() + 1000 * 60 * 10).toISOString(),
      walletAddress: client.address,
      nonce: await litClient.getLatestBlockhash(),
      resources: [{
        resource: new LitAccessControlConditionResource("*"),
        ability: "access-control-condition-decryption",
      }],
    }),
  });

  const decryptedRes = await litClient.decrypt({
    accessControlConditions,
    ciphertext,
    dataToEncryptHash,
    authSig: finalAuthSig,
    chain: "baseSepolia",
  });

  const decryptedUrl = new TextDecoder().decode(decryptedRes.decryptedData);
  console.log(`🟢 SUCCESS: Decrypted Fix URL: ${decryptedUrl}`);
  console.log("\n--- SCENARIO COMPLETE: ATOMIC HANDOVER SUCCESSFUL ---");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
