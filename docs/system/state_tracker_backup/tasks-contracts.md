# Tasks — Smart Contracts (Solidity)

> **Context**: Part of the 12-hour rapid execution monorepo. Built using Hardhat in `/packages/contracts`. This is Phase 1 and the Ground Truth of the project.

---

## Phase 1: Foundation (The Base ERC-8183)
- [ ] Initialize Hardhat + TypeScript project.
- [ ] Install OpenZeppelin contracts and `viem`.
- [ ] Write `ERC8183.sol` with minimal required state functions:
  - `createPact(parameters)`
  - `fundPact(id)`
  - `resolvePact(id, outcome)`
- [ ] Write a `TestERC20.sol` contract with a public `mint()` function for easy local testing.
- [ ] Write a Hardhat deployment script that deploys the ERC20 and ERC8183 locally.
- [ ] **Extraction Task**: Extract the generated ABI and contract addresses and save them to `/apps/backend/config/contracts.ts` so the Evaluator Agent knows exactly how to format its JSON.

---

## Phase 2: Zero-Trust Bug Bounty Hooks
- [ ] Write `CollateralHook.sol`.
  - Modifies `fundPact` to ensure the bounty hunter stakes a $500 collateral.
  - Modifies `resolvePact` to return the collateral on success, or slash it to the client if the PR proof evaluates as fake/failed.
- [ ] Write `PrivacyHook.sol`.
  - Coordinates the atomic handover of the Lit Protocol decryption key once the vlayer TLS proof is verified.
- [ ] Test locally: Simulate the slashing and payout paths using `npx hardhat test`.

---

## Phase 3: Polymarket Wager Hooks
- [ ] Write `WagerHook.sol`.
  - Modifies `fundPact` to enforce symmetric deposits (e.g., both parties must deposit exactly $10,000).
  - Modifies `resolvePact` to sweep 100% of the pool to the address validated by the Evaluator's vlayer proof.
- [ ] Test locally: Simulate Party A and Party B funding, then trigger a resolution to Party A.

---

## Phase 4: Autonomous Swarm Hooks
- [ ] Write `RevenueSplitHook.sol`.
  - Integrates a mock Superfluid Constant Flow Agreement (CFA).
  - Contains an `updateStreamRatios(uint[] ratios)` function callable ONLY by the Evaluator Agent based on the Venice.ai inference.
- [ ] Write `DeFiVaultHook.sol` (Optional/Mocked for time).
  - Intercepts incoming funds and routes them to a mock Yield strategy.
- [ ] Test locally: Call `updateStreamRatios([60, 40])` and verify the internal variables update correctly to reflect the new streaming pie chart.

---

## Phase 5: Hackathon Deployment
- [ ] Configure `hardhat.config.ts` for **Celo Sepolia**.
- [ ] Obtain testnet ETH from a Base faucet.
- [ ] Run the deployment script on the live testnet.
- [ ] Update `/apps/backend/config/contracts.ts` with the final Celo Sepolia addresses.
