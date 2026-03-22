import fs from "fs";
import path from "path";

const VAULT_PATH = path.join(process.cwd(), "vault", "strategies.json");

export interface StrategyRecord {
  jobId: string;
  rubric: string;
  caseType: string;
}

/**
 * STRATEGY VAULT MANAGER
 * Bridges the Creator and Evaluator agents off-chain.
 */
export class VaultManager {
  constructor() {
    if (!fs.existsSync(VAULT_PATH)) {
      fs.writeFileSync(VAULT_PATH, JSON.stringify({}));
    }
  }

  async saveStrategy(jobId: bigint, rubric: string, caseType: string) {
    const data = JSON.parse(fs.readFileSync(VAULT_PATH, "utf8"));
    data[jobId.toString()] = { rubric, caseType };
    fs.writeFileSync(VAULT_PATH, JSON.stringify(data, null, 2));
    console.log(`[VAULT] Strategy saved for Job ${jobId}`);
  }

  async getStrategy(jobId: bigint): Promise<StrategyRecord | null> {
    const data = JSON.parse(fs.readFileSync(VAULT_PATH, "utf8"));
    return data[jobId.toString()] || null;
  }
}
