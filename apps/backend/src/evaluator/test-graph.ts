import { evaluatorGraph } from "./graph";

async function runTest() {
  console.log("--- TESTING EVALUATOR LANGGRAPH (LEVEL 1: LOCAL FLOW) ---");

  // Mock a "Code Fix" Job
  const codeFixState = {
    jobId: 1n,
    description: "Bug Fix for Pandem-Core: Fix nonce overflow in distribution script. See PR #123",
    caseType: "UNKNOWN" as any,
    requiredSkills: [],
    skillResults: {},
    isVerified: false,
    status: "IDLE",
    evaluatorWallet: "0x08c3e48c9e7bc28b9e4258e282c43618EF7D50E5"
  };

  console.log("\n>>> Running Code Fix Scenario...");
  const result1 = await evaluatorGraph.invoke(codeFixState);
  console.log("Final Status:", result1.status);
  console.log("Is Verified:", result1.isVerified);

  // Mock a "Polymarket Wager" Job
  const wagerState = {
    ...codeFixState,
    jobId: 2n,
    description: "Wager: Challenger claims 95% win rate on Polymarket PnL.",
  };

  console.log("\n>>> Running Wager Scenario...");
  const result2 = await evaluatorGraph.invoke(wagerState);
  console.log("Final Status:", result2.status);
  console.log("Is Verified:", result2.isVerified);
}

runTest().catch(console.error);
