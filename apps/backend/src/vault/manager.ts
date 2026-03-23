import fs from "fs";
import path from "path";
import { crypto } from "viem";

const VAULT_PATH = path.join(process.cwd(), "vault", "orders.json");

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
}

/**
 * ORDER VAULT MANAGER
 * Unified storage for the Smart Order Protocol.
 */
export class VaultManager {
  constructor() {
    if (!fs.existsSync(path.dirname(VAULT_PATH))) {
      fs.mkdirSync(path.dirname(VAULT_PATH), { recursive: true });
    }
    if (!fs.existsSync(VAULT_PATH)) {
      fs.writeFileSync(VAULT_PATH, JSON.stringify({}));
    }
  }

  async createOrder(order: Omit<PandemOrder, "orderId" | "status">): Promise<string> {
    const orders = JSON.parse(fs.readFileSync(VAULT_PATH, "utf8"));
    const orderId = Math.random().toString(36).substring(2, 15);
    
    orders[orderId] = {
      ...order,
      orderId,
      status: "CREATED"
    };
    
    fs.writeFileSync(VAULT_PATH, JSON.stringify(orders, null, 2));
    console.log(`[VAULT] New Order Created: ${orderId}`);
    return orderId;
  }

  async getOrder(orderId: string): Promise<PandemOrder | null> {
    const orders = JSON.parse(fs.readFileSync(VAULT_PATH, "utf8"));
    return orders[orderId] || null;
  }

  async linkJob(orderId: string, jobId: bigint) {
    const orders = JSON.parse(fs.readFileSync(VAULT_PATH, "utf8"));
    if (orders[orderId]) {
      orders[orderId].onChainJobId = jobId.toString();
      fs.writeFileSync(VAULT_PATH, JSON.stringify(orders, null, 2));
      console.log(`[VAULT] Order ${orderId} linked to Job ${jobId}`);
    }
  }

  async getOrderByJobId(jobId: bigint): Promise<PandemOrder | null> {
    const orders = JSON.parse(fs.readFileSync(VAULT_PATH, "utf8"));
    return Object.values(orders).find((o: any) => o.onChainJobId === jobId.toString()) as PandemOrder || null;
  }
}
