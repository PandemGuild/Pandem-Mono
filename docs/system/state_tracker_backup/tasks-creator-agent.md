# Tasks — Creator Agent (The API & Skill File)

> **Context**: Part of the 12-hour rapid execution monorepo. This lives in `/apps/backend` (Node.js + Express). **There is NO FRONTEND for the Creator Agent in this pivot.** It is completely headless.

---

## The Concept
Instead of spending 10 hours building React forms, we prove that Pandem is an "Agent-to-Agent" protocol natively. The Creator Agent is simply an API that accepts intents from external AI agents, parses them, and formats the exact on-chain payloads that the Evaluator Agent requires.

---

## Task 1: The `agent.md` Skill File (The Heart of the Creator)
- [ ] Create a static file `public/agent.md` in the Backend.
- [ ] Write clear documentation informing external agents:
  - What Pacts are available (Bug Bounty, Wager, Swarm).
  - The exact parameters required for each.
  - The `x402` payment headers required to access the API.
  - The `POST` endpoints they need to send data to.
- [ ] Test it: Paste this markdown file into ChatGPT/Claude and ask it: *"Based on this file, generate the curl command to create a Polymarket Wager Pact for 10 USDC."* If Claude does it correctly, your skill file works perfectly.

---

## Task 2: Build the Core API Endpoints
All endpoints accept a JSON payload, validate it, and format it to match the ABI schemas defined in Phase 1.

- [ ] **`POST /api/bounty/create`**
  - Accepts: `repoUrl`, `bountyAmountUsdc`, `hunterAddress`.
  - Format the payload and (optionally) execute the `createPact` transaction locally via `viem` as the "Creator".
  
- [ ] **`POST /api/wager/create`**
  - Accepts: `influencerAddress`, `challengerAddress`, `winRateTarget`, `stakeAmount`.
  - Formats payload.

- [ ] **`POST /api/swarm/init`**
  - Accepts: `devAgentAddress`, `socialAgentAddress`, `initialFunds`.
  - Formats payload.

---

## Task 3: The Light Local DB
Since we ripped out subgraphs and the heavy stuff, we need a fast way to store active pacts between the API and the Explorer frontend.

- [ ] Add a simple SQLite or even a local `pacts.json` file.
- [ ] Every time an endpoint in Task 2 runs, save the Pact state (e.g., Status: PENDING) to this DB.
- [ ] Create a `GET /api/pacts` endpoint that the Vite Frontend can poll to get the active roster of pacts.
