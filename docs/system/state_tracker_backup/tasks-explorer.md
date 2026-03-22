# Tasks — Explorer (The Glass)

> **Context**: Part of the 12-hour rapid execution monorepo. This lives in `/apps/frontend` using Vite + React + Tailwind. 

---

## The Concept
The Explorer is strictly a read-only visualizer. Its only job is to provide the hackathon judges with a stunning visual representation of the complex math happening in the Backend and the Contracts.

---

## Phase 1: Vite Foundation
- [ ] Initialize the Vite React project.
- [ ] Install TailwindCSS and configure dark mode.
- [ ] Install `wagmi` and `viem` to connect directly to the Base Sepolia (or local Hardhat) network so we can read contract states. 
- [ ] Set up a polling interval (`useQuery` or `useEffect`) to fetch active pacts from the backend `GET /api/pacts` endpoint.

---

## Phase 1.5: Shared Metadata Components
- [ ] Create a "Pact Context" sub-component that is rendered inside every active pact view (Bounty, Wager, Swarm). It must dynamically display:
  - **Human-Readable Pact**: The English/natural language terms of the agreement.
  - **The Smart Contract**: The ERC-8183 Solidity code/address backing the pact.
  - **Evaluator Identity**: The Evaluator Agent's Name and its `ERC-8004` registry information.
  - **Verification Skill**: A link/display of the specific skill file (`agent.md` or similar) used for this pact resolution.

---

## Phase 2: Bug Bounty Visualizer
- [ ] Create a "Pact Card" component.
- [ ] **State 1 (Pending)**: Display a large Padlock icon. Text: *"Payload encrypted via Lit Protocol. Awaiting PR Merge on GitHub."*
- [ ] **State 2 (Settled)**: When the backend updates the state, play an unlock animation. Display the vlayer proof confirmation: *"Proof Verified: PR 204 Merged -> 5000 USDC Transferred."*

---

## Phase 3: Polymarket Wager Arena
- [ ] Create a split-screen "Arena" card.
- [ ] **State 1 (Locked)**: Left side shows Influencer ($10k USDC), Right side shows Challenger ($10k USDC). Middle shows "Target: >90% Win Rate".
- [ ] **State 2 (Settled)**: Show the vlayer snapshot of the Polymarket UI. Render the swept funds moving entirely to the winning side.

---

## Phase 4: Autonomous Swarm Dashboard (The Masterpiece)
- [ ] Import `recharts` for charting.
- [ ] **Visual 1**: A dynamic pie chart representing the Superfluid revenue stream splits.
- [ ] **Visual 2**: A mock data feed of events.
  - *Dev Agent*: "Shipped 40 lines of solidity."
  - *Social Agent*: "Generated 2000 impressions on X."
  - *Venice.ai Evaluator*: "Inferred contribution logic. Outputting ratio: 60/40. Executing."
- [ ] Animate the pie chart values shifting in real time when the backend updates the `RevenueSplitHook` ratio.

---

## Phase 5: Polish
- [ ] Add a clean Matrix/Cyberpunk color palette (Neon greens, dark grays).
- [ ] Ensure the UI is highly responsive for the screen-recorded video.
- [ ] Add loading skeletons when polling for data.
