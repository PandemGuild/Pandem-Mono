import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import * as dotenv from "dotenv";
import { createPublicClient, http, parseAbiItem } from "viem";
import { baseSepolia } from "viem/chains";
import { HANDOVER_CONTRACT_ADDRESS } from "../config/contracts";
import { VaultManager } from "./vault/manager";
import { StrategyGenerator } from "./creator/strategy-generator";
import { evaluatorGraph } from "./evaluator/graph";

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
const vault = new VaultManager();
const generator = new StrategyGenerator();

app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

// 1. DISPATCHER: Monitor On-Chain Events
const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(process.env.RPC_URL),
});

console.log("--- PANDEM HIGH-INTEGRITY BACKEND ---");

publicClient.watchEvent({
  address: HANDOVER_CONTRACT_ADDRESS as `0x${string}`,
  event: parseAbiItem("event JobFunded(uint256 indexed jobId, address indexed client, uint256 amount)"),
  onLogs: async (logs) => {
    for (const log of logs) {
      const jobId = log.args.jobId as bigint;
      console.log(`\n[DISPATCHER] Job ${jobId} Funded! Triggering Evaluator Agent...`);
      
      const strategy = await vault.getStrategy(jobId);
      if (!strategy) {
        console.warn(`⚠️ No rubric found for Job ${jobId}. Skipping verification.`);
        continue;
      }

      console.log(`[DISPATCHER] Running Evaluator Graph for ${strategy.caseType}...`);
      await evaluatorGraph.invoke({
        jobId,
        rubric: strategy.rubric,
        caseType: strategy.caseType as any,
        description: "",
        requiredSkills: [],
        skillResults: {},
        isVerified: false,
        verdictReasoning: "",
        status: "IDLE"
      });
    }
  },
});

// 2. CREATOR API: Strategic Architect Entry Point
app.post("/api/jobs/architect", async (req, res) => {
  const { jobId, intent } = req.body;
  console.log(`\n[CREATOR] Architecting Strategy for Job ${jobId}...`);
  
  try {
    const strategy = await generator.generate(intent);
    await vault.saveStrategy(BigInt(jobId), strategy.rubric, strategy.caseType);
    
    res.json({ status: "success", strategy });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate strategy" });
  }
});

app.get("/health", (req, res) => {
  res.json({ status: "online", contract: HANDOVER_CONTRACT_ADDRESS });
});

app.listen(port, () => {
  console.log(`Pandem Backend running at http://localhost:${port}`);
});
