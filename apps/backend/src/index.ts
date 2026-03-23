import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import * as dotenv from "dotenv";
import { createPublicClient, http, parseAbiItem } from "viem";
import { baseSepolia } from "viem/chains";
import { HANDOVER_CONTRACT_ADDRESS } from "../config/contracts";
import { RedisService } from "./services/redis";
import { StrategyGenerator } from "./creator/strategy-generator";
import { evaluatorGraph } from "./evaluator/graph";

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
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

console.log("--- PANDEM UNIFIED REDIS BACKEND ---");

publicClient.watchEvent({
  address: HANDOVER_CONTRACT_ADDRESS as `0x${string}`,
  event: parseAbiItem("event JobFunded(uint256 indexed jobId, address indexed client, uint256 amount)"),
  onLogs: async (logs) => {
    for (const log of logs) {
      const jobId = log.args.jobId as bigint;
      console.log(`\n[DISPATCHER] Job ${jobId} Funded!`);
      
      const order = await RedisService.getOrderByJobId(jobId);
      if (!order) {
        console.warn(`⚠️ No order/rubric found in Redis for Job ${jobId}. Skipping.`);
        continue;
      }

      console.log(`[DISPATCHER] Triggering Evaluator Agent for Order ${order.orderId}...`);
      await evaluatorGraph.invoke({
        jobId,
        rubric: order.strategy.rubric,
        caseType: order.strategy.caseType as any,
        description: order.job.description,
        requiredSkills: order.strategy.requiredSkills,
        skillResults: {},
        isVerified: false,
        verdictReasoning: "",
        status: "IDLE"
      });
    }
  },
});

// 2. UNIFIED ORDER API
app.post("/api/orders/create", async (req, res) => {
  const { job } = req.body;
  console.log(`\n[ORDER] Architecting Deal for: ${job.description}`);
  
  try {
    const strategy = await generator.generate(job.description);
    const orderId = await RedisService.saveOrder({ job, strategy });
    
    res.json({ 
      status: "success", 
      orderId, 
      paylink: `http://localhost:3000/checkout/${orderId}` 
    });
  } catch (error) {
    console.error("Order creation failed:", error);
    res.status(500).json({ error: "Failed to architect deal" });
  }
});

// 3. INTERNAL LINKING
app.post("/api/orders/:id/link", async (req, res) => {
  const { jobId } = req.body;
  await RedisService.linkJob(req.params.id, BigInt(jobId));
  res.json({ status: "linked" });
});

app.get("/api/orders/:id", async (req, res) => {
  const order = await RedisService.getOrder(req.params.id);
  if (!order) return res.status(404).json({ error: "Order not found" });
  res.json(order);
});

app.listen(port, () => {
  console.log(`Pandem Backend running at http://localhost:${port}`);
});
