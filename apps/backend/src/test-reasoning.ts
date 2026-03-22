import { StrategyGenerator } from "./creator/strategy-generator";
import { evaluatorGraph } from "./evaluator/graph";

async function main() {
  console.log("--- TESTING PANDEM REASONING ARCHITECTURE ---");
  console.log("Simulating: Atomic Bug Bounty Handover\n");

  // 1. CREATOR AGENT: Strategic Architect Phase
  const creator = new StrategyGenerator();
  const proposerIntent = "I have fixed the distribution script overflow in Pandem-Mono. The PR #42 uses BigInt for all calculations.";
  
  console.log("[STEP 1: CREATOR] Analyzing intent and generating rubric...");
  const strategy = await creator.generate(proposerIntent);
  console.log("   Case Type:", strategy.caseType);
  console.log("   Required Skills:", strategy.requiredSkills.join(", "));
  console.log("   Generated Rubric:\n", strategy.rubric, "\n");

  // 2. EVALUATOR AGENT: High-Integrity Auditor Phase
  console.log("[STEP 2: EVALUATOR] Running Auditor Graph with the new Rubric...");
  
  const initialState = {
    jobId: 42n,
    description: proposerIntent,
    rubric: strategy.rubric,
    caseType: strategy.caseType as any,
    requiredSkills: strategy.requiredSkills,
    skillResults: {},
    isVerified: false,
    verdictReasoning: "",
    status: "IDLE"
  };

  const finalState = await evaluatorGraph.invoke(initialState);

  console.log("\n[FINAL RESULT]");
  console.log("   Verification Status:", finalState.isVerified ? "🟢 APPROVED" : "🔴 REJECTED");
  console.log("   Auditor Reasoning:", finalState.verdictReasoning);
  console.log("\n--- TEST COMPLETE ---");
}

main().catch(console.error);
