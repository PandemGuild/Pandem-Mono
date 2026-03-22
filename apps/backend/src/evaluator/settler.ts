import { createWalletClient, createPublicClient, http, custom } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { HANDOVER_CONTRACT_ADDRESS, IACP_ABI } from "../../config/contracts";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * EVALUATOR SETTLER
 * Responsible for signing the final on-chain resolution transaction.
 */
export class EvaluatorSettler {
  private account;
  private client;
  private publicClient;

  constructor() {
    const key = process.env.EVALUATOR_PRIVATE_KEY as `0x${string}`;
    if (!key) throw new Error("EVALUATOR_PRIVATE_KEY not found in .env");

    this.account = privateKeyToAccount(key);
    this.client = createWalletClient({
      account: this.account,
      chain: baseSepolia,
      transport: http(process.env.RPC_URL),
    });
    this.publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(process.env.RPC_URL),
    });
  }

  /**
   * Finalizes the job on-chain.
   */
  async completeJob(jobId: bigint, reasonHash: `0x${string}`) {
    console.log(`[SETTLER] Finalizing Job ${jobId} on Base Sepolia...`);
    
    try {
      const { request } = await this.publicClient.simulateContract({
        account: this.account,
        address: HANDOVER_ADDRESS as `0x${string}`,
        abi: IACP_ABI,
        functionName: "complete",
        args: [jobId, reasonHash, "0x"],
      });

      const hash = await this.client.writeContract(request);
      console.log(`🟢 Settlement Transaction Sent! Hash: ${hash}`);
      
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
      console.log(`🟢 Job ${jobId} Officially COMPLETED.`);
      return receipt;
    } catch (error) {
      console.error("Settlement failed:", error);
      throw error;
    }
  }
}

const HANDOVER_ADDRESS = HANDOVER_CONTRACT_ADDRESS;
