# Tasks — Evaluator Agent (The Engine)

> **Context**: Part of the 12-hour rapid execution monorepo. This lives in `/apps/backend` (Node.js + Express). This is the "Brain" of the project that runs LangGraph and triggers smart contracts using `viem`.

---

## Phase 1: Setup
- [ ] Initialize Express server in `/apps/backend`.
- [ ] Install `@langchain/core`, `@langchain/langgraph`, `@langchain/openai` (or equivalent), `viem`, and `dotenv`.
- [ ] Import the exact ABI and addresses exported from `/packages/contracts` into a `contracts.ts` config file.
- [ ] Set up the `viem` wallet client using a private key (the "Evaluator Wallet" that will pay gas to call `resolvePact` on Base).

---

## Phase 2: Zero-Trust Bug Bounty Verification
- [ ] **Tool Build**: Integrate the `vlayer` SDK (or mock it accurately if constrained) specifically to verify TLS proofs of GitHub PR merges.
- [ ] **Node Build**: Create a LangGraph Node `VerifyGitHubProof`. It takes a raw JSON payload (containing a mock vlayer proof), validates the TLS signature, and checks if status == `204 Merged`.
- [ ] **Execution Node**: If true, call `viem` to execute `resolvePact()` on the local Hardhat node.
- [ ] **Raw Test**: POST a mock vlayer payload directly to your LangGraph test endpoint and verify your local Hardhat terminal shows a successful contract resolution.

---

## Phase 3: Polymarket Wager Verification
- [ ] **Tool Build**: Integrate `vlayer` to verify Polymarket DOM proofs.
- [ ] **Node Build**: Create a LangGraph Node `VerifyPolymarketPnL`. Extract the "Total Trades" and "Win Count" from the incoming proof payload, and calculate the `Win Rate %`.
- [ ] **Evaluation Logic**: If `Win Rate > 90%`, set winner = Influencer. Else, winner = Challenger.
- [ ] **Raw Test**: Feed a mock Polymarket proof (e.g., claiming 95% win rate). Watch LangGraph evaluate it and resolve the local contract in favor of the Influencer.

---

## Phase 4: Autonomous Swarm Ratio Inference
- [ ] **Tool Build**: Integrate the **Venice.ai** API (via `x402` or standard API key).
- [ ] **Data Fetchers**: Write simple functions to pull GitHub commits (Dev Agent) and Twitter impressions (Social Agent) for the last 7 days.
- [ ] **Node Build**: Create a LangGraph Node `DetermineSwarmRatio`. 
  - Construct a prompt: *"Based on X commits and Y impressions, output a fair revenue split as a pure JSON array: [Dev%, Social%]"*.
  - Feed to Venice.ai and parse the JSON.
- [ ] **Execution Node**: Call `updateStreamRatios([Dev%, Social%])` on the local `RevenueSplitHook` contract via `viem`.
- [ ] **Raw Test**: Run the graph with hardcoded GitHub/Twitter data. Verify Venice outputs the ratio and triggers the blockchain update.

---

## Phase 5: Polish & Deployment
- [ ] Update the `viem` client RPC URL to point to **Celo Sepolia**.
- [ ] Add basic Express error handling and console logging to output `conversationLog` paths so you can copy-paste them for the Devfolio submission.
