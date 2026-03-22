import { evaluatorGraph } from "./evaluator/graph";
import { VaultManager } from "./vault/manager";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * EVALUATOR AGENT TRIGGER
 * This is Step 2 of the Atomic Handover workflow.
 */
async function main() {
  const jobIdStr = process.argv[2];
  if (!jobIdStr) {
    console.error("❌ Usage: bun run src/run-evaluator.ts <jobId>");
    process.exit(1);
  }

  const jobId = BigInt(jobIdStr);
  const vault = new VaultManager();

  console.log(`\n--- ATOMIC HANDOVER: STEP 2 (EVALUATOR) ---`);
  console.log(`Target: Job #${jobId}`);

  // 1. Fetch the Strategic Rubric from the Vault
  const strategy = await vault.getStrategy(jobId);
  if (!strategy) {
    console.error(`❌ No strategic rubric found for Job #${jobId}. Aborting.`);
    process.exit(1);
  }

  console.log("🟢 Hidden Rubric retrieved from Vault.");

  // 2. Invoke the LangGraph State Machine
  console.log("2. Invoking LangGraph Evaluator Agent...");
  
  const initialState = {
    jobId,
    rubric: strategy.rubric,
    caseType: strategy.caseType as any,
    description: "", // Ingest Node will populate this from chain
    requiredSkills: [],
    skillResults: {},
    isVerified: false,
    verdictReasoning: "",
    status: "IDLE"
  };

  try {
    const finalState = await evaluatorGraph.invoke(initialState);

    console.log("\n[AGENT VERDICT]");
    console.log(`   Status:    ${finalState.status}`);
    console.log(`   Verified:  ${finalState.isVerified ? "🟢 YES" : "🔴 NO"}`);
    console.log(`   Reasoning: ${finalState.verdictReasoning}`);

    if (finalState.status === "COMPLETED") {
      console.log("\n--- E2E WORKFLOW SUCCESS: FUNDS RELEASED ---");
    } else {
      console.log("\n--- E2E WORKFLOW TERMINATED: NO SETTLEMENT ---");
    }
  } catch (error) {
    console.error("❌ LangGraph execution failed:", error);
  }
}

main().catch(console.error);
