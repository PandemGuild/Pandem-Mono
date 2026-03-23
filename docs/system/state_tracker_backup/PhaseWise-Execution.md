# Pandem — 12-Hour Micro-Step Execution Checklist

> **Director's Manual**: This is your playbook. You are directing Jules. You do not paste this entire document to the AI. You feed Jules *one micro-step at a time*. You test it, verify it works locally, and then tell Jules to move to the next step.
> **Execution Flow**: Contracts (Ground Truth) -> Evaluator Agent (Engine Test) -> Creator Agent (API) -> Explorer (Glass).

---

## Phase 1: Foundation (Hours 1-2)
**Goal:** A working Vite + Express + Hardhat monorepo that builds concurrently.

- [ ] **Step 1:** Initialize a standard NPM workspace monorepo at the project root. Create `package.json` with `.workspaces` pointing to `packages/*` and `apps/*`.
- [ ] **Step 2:** `mkdir packages/contracts`. Initialize a Hardhat TypeScript project inside it. Install OpenZeppelin contracts and viem.
- [ ] **Step 3:** `mkdir apps/backend`. Initialize an Express (+ TypeScript) server. Install `@langchain/core`, `dotenv`, and `cors`.
- [ ] **Step 4:** `mkdir apps/frontend`. Initialize a Vite + React + TailwindCSS application. Install `wagmi` and `viem`.
- [ ] **Step 5:** Create a root command (like `npm run dev`) using `concurrently` to spin up the local Hardhat node, the Express backend (port 3000), and the Vite frontend (port 5173). Validate all three run simultaneously.

---

## Phase 2: Example 1 — Zero-Trust Bug Bounty (Hours 3-5)
**Goal:** The Lit + vlayer GitHub proof primitive built from contract to glass.

- [ ] **Step 6 (Contract):** Research the ERC-8183 spec. Write a simplified `BugBountyERC8183.sol` in `/packages/contracts` with `createPact`, `fundPact`, and `resolvePact`.
- [ ] **Step 7 (Contract):** Write `CollateralHook.sol` to handle the deposit slashing logic for the bounty hunter.
- [ ] **Step 8 (Contract):** Compile contracts. Write a Hardhat deployment script. Deploy them to the local `localhost:8545` network. Extract the ABI and contract addresses to `/apps/backend/config/contracts.ts`.
- [ ] **Step 9 (Raw Test):** Write a Hardhat test to simulate creating, funding, and resolving a bounty using mock transaction data. Ensure it mathematically works.
- [ ] **Step 10 (Evaluator):** In the Backend, build the integration with the `vlayer` SDK (specifically the logic to verify a client-side TLS proof of a GitHub PR merge).
- [ ] **Step 11 (Evaluator):** Build the LangGraph `EvaluatorGraph`. Define nodes to fetch the pact, run the `vlayer` verification, and (if true) use `viem` to emit the transaction to the local Hardhat contract to settle the bounty.
- [ ] **Step 12 (Engine Test):** Send a hardcoded "raw" mock proof directly into your LangGraph engine. Verify it detects a successful merge and triggers the local smart contract payout.
- [ ] **Step 13 (Creator API):** Build `POST /api/bounty/create` in the Express server. It accepts JSON from other agents and formats the exact on-chain parameters you just tested in Step 9.
- [ ] **Step 14 (Explorer):** Build a basic React component in Vite to fetch active bounties from the blockchain. Ensure the detail view displays the **Human-Readable Pact text**, the **ERC-8183 Solidity Contract details**, the **Evaluator Agent's Name & ERC-8004 Registry Data**, and a link to the **Skill File** used for verification, alongside the locked/unlocked state.

---

## Phase 3: Example 2 — The Polymarket Wager (Hours 6-8)
**Goal:** The symmetric funding primitive and Web2 PnL cryptographic verification.

- [ ] **Step 15 (Contract):** Write `WagerHook.sol` in `/contracts` to enforce symmetric deposits from both parties (e.g., $10k + $10k).
- [ ] **Step 16 (Contract):** Compile, write deployment script, deploy locally, and extract the new ABI to the backend.
- [ ] **Step 17 (Raw Test):** Run a Hardhat script simulating two parties depositing, resolving with mock winner data, and checking final balances.
- [ ] **Step 18 (Evaluator):** In the Backend, build the vlayer SDK integration to scrape the authenticated Polymarket DOM, proving Win Rate >90%.
- [ ] **Step 19 (Evaluator):** Expand the LangGraph to route Wager pacts to the Polymarket verifier node.
- [ ] **Step 20 (Engine Test):** Fire a hardcoded mock Polymarket proof at the Evaluator. Confirm it triggers the local `WagerHook` payout.
- [ ] **Step 21 (Creator API):** Build `POST /api/wager/create` to accept betting terms and initialize the pact. Update the `agent.md` skill file to document this new endpoint for external agents.
- [ ] **Step 22 (Explorer):** Build the "Wager Arena" React component to visualize the two parties and the sweeping of funds.

---

## Phase 4: Example 3 — Autonomous Swarm (Hours 9-11)
**Goal:** The multi-agent Superfluid revenue splitting integration.

- [ ] **Step 23 (Contract):** Research the Superfluid SDK. Write `RevenueSplitHook.sol` wrapping a Constant Flow Agreement (CFA), and a `DeFiVaultHook.sol` wrapping a mock Uniswap V3 LP.
- [ ] **Step 24 (Contract):** Deploy locally and extract ABIs.
- [ ] **Step 25 (Raw Test):** Simulate a direct contract call that takes a `[60, 40]` ratio and successfully updates a Superfluid stream locally.
- [ ] **Step 26 (Evaluator):** Build the **Venice.ai Inference Engine** in the Backend. This script pulls mock GitHub lines of code (Dev) and Twitter impressions (Social), feeds them into the Venice LLM securely, and extracts the JSON `[Dev%, Social%]` ratio.
- [ ] **Step 27 (Evaluator):** Expand the LangGraph to evaluate the swarm every hour, pulling the Venice ratio and auto-calling the `RevenueSplitHook.updateStreamRatios()` function.
- [ ] **Step 28 (Engine Test):** Run the LangGraph with mock GitHub/Twitter data. Verify Venice outputs the ratio and the Superfluid stream updates on the local blockchain.
- [ ] **Step 29 (Creator API):** Build `POST /api/swarm/init`.
- [ ] **Step 30 (Explorer):** Build the "Swarm Dashboard" with a dynamic React pie chart that updates based on the active stream ratios.

---

## Phase 5: Polish & Deployment (Hour 12)
**Goal:** Move from local simulation to testnet reality.

- [ ] **Step 31:** Change Hardhat network config to Celo Sepolia. Fund a deployer wallet with test ETH. 
- [ ] **Step 32:** Deploy all Phase 2, 3, and 4 contracts to Celo Sepolia.
- [ ] **Step 33:** Update the Backend `contracts.ts` config with the live testnet addresses.
- [ ] **Step 34:** Run an E2E test of all 3 examples on the testnet.
- [ ] **Step 35:** Deploy Frontend to Vercel/Netlify. Deploy Backend to Render/Railway.
- [ ] **Step 36:** Prepare the `submissionMetadata.json` Devfolio payload. Record the loom video demonstrating the Frontend while the Backend evaluates the LangGraph. Submit.
