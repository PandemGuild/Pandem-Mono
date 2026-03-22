# Pandem Project - AI State & Understanding

## Overview
Pandem is a complete commerce infrastructure built entirely on **ERC-8183**, facilitating trustless agreements for humans and AI agents. It wraps the raw ERC-8183 Job primitive into three distinct layers:
1. **Creator Agent** (Natural language & API job generation)
2. **Evaluator Agent** (Autonomous verification via AI/zkTLS)
3. **Explorer** (On-chain state and evidence indexing)

## Key Technical Stack
- **Smart Contracts:** Solidity, Hardhat, OpenZeppelin, Base Sepolia
- **Backend (Agents):** Express, TypeScript, LangGraph.js, viem
- **Frontend (Explorer/Creator):** Vite, React, Tailwind, wagmi
- **Decentralized Integrations:** 
  - `vlayer` (zkTLS session proofs)
  - `Lit Protocol` (Encrypted payloads)
  - `Venice.ai` (Private inference)
  - `Superfluid` (Continuous payment streams)

## Execution Playbook (12-Hour Plan)
* **Phase 1: Foundation** -> NPM workspace monorepo (Contracts, Backend, Frontend).
* **Phase 2: Example 1 (Bug Bounty)** -> `BugBountyERC8183.sol`, `CollateralHook.sol`, GitHub PR vlayer verification.
* **Phase 3: Example 2 (Wager)** -> `WagerHook.sol`, Polymarket PnL verification.
* **Phase 4: Example 3 (Swarm)** -> `RevenueSplitHook.sol`, Venice.ai contribution evaluation, Superfluid routing.
* **Phase 5: Deployment** -> Base Sepolia, Vercel/Railway, Devfolio submission.

## Working Directory
All execution steps will target the primary workspace root, organizing into `packages/contracts`, `apps/backend`, and `apps/frontend`.
