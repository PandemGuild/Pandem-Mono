import { Redis } from "@upstash/redis";
import CryptoJS from "crypto-js";
import * as dotenv from "dotenv";

dotenv.config();

export interface PandemOrder {
  orderId: string;
  job: {
    description: string;
    budget: string;
    provider: string;
    evaluator: string;
    expiry: number;
  };
  strategy: {
    caseType: string;
    requiredSkills: string[];
    rubric: string;
  };
  onChainJobId?: string;
  status: "CREATED" | "FUNDED" | "SETTLED";
  createdAt: number;
}

/**
 * REDIS SERVICE
 * High-integrity storage for Pandem Smart Orders.
 */
export class RedisService {
  private static redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });

  /**
   * Generates a deterministic hash for the order based on its key parameters.
   */
  static generateOrderHash(job: any): string {
    const payload = `${job.description}-${job.budget}-${job.provider}-${job.evaluator}-${job.expiry}`;
    return CryptoJS.SHA256(payload).toString().substring(0, 16);
  }

  static async saveOrder(order: Omit<PandemOrder, "orderId" | "status" | "createdAt">): Promise<string> {
    const orderId = this.generateOrderHash(order.job);
    const newOrder: PandemOrder = {
      ...order,
      orderId,
      status: "CREATED",
      createdAt: Date.now()
    };

    await this.redis.set(`order:${orderId}`, newOrder);
    console.log(`[REDIS] Order ${orderId} saved.`);
    return orderId;
  }

  static async getOrder(orderId: string): Promise<PandemOrder | null> {
    return await this.redis.get<PandemOrder>(`order:${orderId}`);
  }

  static async linkJob(orderId: string, jobId: bigint) {
    const order = await this.getOrder(orderId);
    if (order) {
      order.onChainJobId = jobId.toString();
      await this.redis.set(`order:${orderId}`, order);
      // Create a reverse mapping for the dispatcher
      await this.redis.set(`job:${jobId.toString()}`, orderId);
      console.log(`[REDIS] Linked Order ${orderId} to Job ${jobId}`);
    }
  }

  static async getOrderByJobId(jobId: bigint): Promise<PandemOrder | null> {
    const orderId = await this.redis.get<string>(`job:${jobId.toString()}`);
    if (!orderId) return null;
    return await this.getOrder(orderId);
  }
}
