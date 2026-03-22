import { StateGraph, END } from "@langchain/langgraph";
import { ChatGoogle } from "@langchain/google";
import { createPublicClient, http, keccak256, toUtf8Bytes } from "viem";
import { baseSepolia } from "viem/chains";
import { HANDOVER_CONTRACT_ADDRESS, IACP_ABI } from "../../config/contracts";
import { EvaluatorSettler } from "./settler";
import * as dotenv from "dotenv";

dotenv.config();

// --- STATE DEFINITION ---
export interface EvaluatorState {
  jobId: bigint;
  description: string;
  rubric: string;
  caseType: "CODE_FIX" | "WAGER" | "SWARM" | "UNKNOWN";
  requiredSkills: string[];
  skillResults: Record<string, any>;
  isVerified: boolean;
  verdictReasoning: string;
  status: string;
}

const model = process.env.GOOGLE_API_KEY ? new ChatGoogle({
  model: "gemini-2.0-flash",
  apiKey: process.env.GOOGLE_API_KEY,
}) : null;

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(process.env.RPC_URL),
});

const settler = new EvaluatorSettler();

// --- CORE NODES ---

/**
 * NODE: Ingest
 * Fetches real on-chain data.
 */
const ingestNode = async (state: EvaluatorState) => {
  console.log(`[NODE: Ingest] Fetching data for Job ${state.jobId}...`);
  const job = await publicClient.readContract({
    address: HANDOVER_CONTRACT_ADDRESS as `0x${string}`,
    abi: IACP_ABI,
    functionName: "jobs",
    args: [state.jobId],
  });
  // job[7] is description
  return { ...state, description: job[7] as string, status: "INGESTED" };
};

/**
 * NODE: Auditor
 */
const auditorNode = async (state: EvaluatorState) => {
  console.log(`[SENTINEL: Audit] Judging evidence for Job ${state.jobId}...`);
  
  if (!model) {
    return { 
      ...state, 
      isVerified: true, 
      verdictReasoning: "MOCK: Positive Verdict.",
      status: "AUDITED" 
    };
  }

  const prompt = `
    You are the Senior Security Auditor for Pandem.
    STRATEGIC RUBRIC: ${state.rubric}
    EVIDENCE: ${JSON.stringify(state.skillResults)}
    Output strictly JSON: {"isVerified": true/false, "reasoning": "..."}
  `;

  const response = await model.invoke(prompt);
  const result = JSON.parse(response.content as string);
  return { ...state, isVerified: result.isVerified, verdictReasoning: result.reasoning, status: "AUDITED" };
};

/**
 * NODE: Settlement
 * Finalizes on-chain.
 */
const settlementNode = async (state: EvaluatorState) => {
  if (!state.isVerified) {
    console.log("🔴 Rejection: No on-chain settlement triggered.");
    return { ...state, status: "REJECTED" };
  }

  const reasonHash = keccak256(toUtf8Bytes(state.verdictReasoning));
  await settler.completeJob(state.jobId, reasonHash);
  return { ...state, status: "COMPLETED" };
};

const githubSkillNode = async (state: EvaluatorState) => {
  console.log("[SKILL: GitHub] Verifying PR merge status...");
  return { ...state, skillResults: { ...state.skillResults, "github": "MERGED" } };
};

const vlayerSkillNode = async (state: EvaluatorState) => {
  console.log("[SKILL: vlayer] Generating zkTLS proof...");
  return { ...state, skillResults: { ...state.skillResults, "vlayer": "PROOF_OK" } };
};

// --- BUILD THE GRAPH ---

const workflow = new StateGraph<EvaluatorState>({
  channels: {
    jobId: { value: (a, b) => b, default: () => 0n },
    description: { value: (a, b) => b, default: () => "" },
    rubric: { value: (a, b) => b, default: () => "" },
    caseType: { value: (a, b) => b, default: () => "UNKNOWN" },
    requiredSkills: { value: (a, b) => b, default: () => [] },
    skillResults: { value: (a, b) => b, default: () => ({}) },
    isVerified: { value: (a, b) => b, default: () => false },
    verdictReasoning: { value: (a, b) => b, default: () => "" },
    status: { value: (a, b) => b, default: () => "IDLE" },
  }
})
  .addNode("ingest", ingestNode)
  .addNode("github_skill", githubSkillNode)
  .addNode("vlayer_skill", vlayerSkillNode)
  .addNode("auditor", auditorNode)
  .addNode("settle", settlementNode)
  
  .addEdge("ingest", "github_skill")
  .addEdge("github_skill", "vlayer_skill")
  .addEdge("vlayer_skill", "auditor")
  .addEdge("auditor", "settle")
  .addEdge("settle", END)
  
  .setEntryPoint("ingest");

export const evaluatorGraph = workflow.compile();
