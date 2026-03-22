# PROJECT_PLAN: Atomic Bug Bounty Handover System

## 1. Architecture Overview
A trustless commerce system for bug bounties built on the **ERC-8183** standard. The system uses an **AI Evaluator Agent** (LangGraph) as the independent mediator to verify fixes and broker the handover of code from a Proposer to a Client.

### Core Components
- **AtomicHandover.sol**: The core smart contract managing the Job lifecycle (Open, Funded, Submitted, Completed, Rejected, Expired).
- **Evaluator Agent (LangGraph)**: An autonomous agent that clones private GitHub repos, verifies fixes, generates sanitized download package, and triggers on-chain resolution.
- **Lit Protocol**: For atomic handover of decryption keys for the fix.
- **Filecoin/IPFS**: For decentralized storage of the (encrypted) fix and evaluation reports.

---

## 2. Smart Contract Design (ERC-8183 Based)
The contract will implement the `IACP` (Agent Commerce Protocol) interface with a focus on modular hooks.

### State Transitions
1. **Open**: Proposer creates the Job, describing the bug and setting the price.
2. **Funded**: Client deposits the bounty (e.g., $10,000). The Proposer may also provide an optional $500 slashing fee.
3. **Submitted**: Proposer submits the (encrypted) fix hash.
4. **Completed**: Evaluator verifies the fix and releases funds to the Proposer.
5. **Rejected (Cancelled)**: Client cancels the deal (no bad faith); funds returned to Client.
6. **Rejected (Slashed)**: Client claims the Proposer's slashing fee due to bad faith; funds returned to Client + slashing fee.

### Hooks
- `beforeFund`: Verify slashing fee if applicable.
- `beforeSubmit`: Ensure the fix hash is provided.
- `afterComplete`: Trigger the Lit Protocol key handover (via events/indexers).

---

## 3. Evaluator Agent Design (LangGraph)
The agent will be a state machine with the following nodes:

1. **Clone & Inspect**: Clones the private GitHub repo (using provided access).
2. **Verification Engine**: Runs automated tests/checks to verify the fix is real and deployed.
3. **Sanitization**: Generates a sanitized download package (e.g., a ZIP file uploaded to IPFS).
4. **Encryption**: Encrypts the download link using Lit Protocol, accessible only by the Client.
5. **Resolution Trigger**: Calls `complete` or `reject` on the `AtomicHandover.sol` contract based on the verification result.

---

## 4. External Dependencies
- **Lit Protocol SDK**: For access control and decryption key management.
- **Filecoin/IPFS (Lighthouse/Web3.Storage)**: For off-chain storage.
- **GitHub API**: For Evaluator access to private repositories.
- **Viem/Ethers**: For on-chain interactions.
- **Hardhat/Foundry**: For contract development and testing.

---

## 5. File/Folder Structure (Monorepo)
```
/
â”œâ”€ .gemini/skills/      # Agent Skills (eth-foundations, etc.)
â”œâ”€ apps/
â”‚  â”œâ”€ frontend/         # Vite + React + Tailwind (Explorer/Dashboard)
â”‚  â””â”€ backend/          # Express + LangGraph (Evaluator Agent)
â”œâ”€ packages/
â”‚  â””â”€ contracts/        # Hardhat + Solidity (AtomicHandover.sol)
â”œâ”€ PROJECT_PLAN.md      # This file
â””â”€ CURRENT_OBJECTIVE.md  # Dynamic handoff file
```

---

## 7. Technical Interface Guide (EIP-8183)
Use these exact signatures and sequences when interacting with `AtomicHandover.sol`.

### Function Signatures
- **Create**: `createJob(address provider, address evaluator, uint256 expiredAt, string description, address hook)`
- **Negotiate**: `setBudget(uint256 jobId, uint256 amount, bytes optParams)` (Callable by Client or Proposer)
- **Fund**: `fund(uint256 jobId, bytes optParams)` (Callable by Client only)
- **Submit**: `submit(uint256 jobId, bytes32 deliverable, bytes optParams)` (Callable by Proposer only)
- **Resolve (Success)**: `complete(uint256 jobId, bytes32 reason, bytes optParams)` (Callable by Evaluator only)
- **Resolve (Failure)**: `reject(uint256 jobId, bytes32 reason, bytes optParams)` (Callable by Client if Open, Evaluator if Funded/Submitted)

### Event Logic for Agents
- **Discovery**: Watch for `JobCreated` to find new tasks.
- **Trigger**: Watch for `JobFunded` to start work.
- **Evaluation**: Watch for `JobSubmitted` to start the verification engine.
- **Settlement**: Watch for `JobCompleted` or `JobRejected` to update reputation scores.

---

## 8. Reusability Note
This contract is a generic implementation of the **Agentic Commerce Protocol**. It is not tied to bug bounties specifically and can be reused for any trustless agent-to-agent transaction by simply passing different `description` strings and `evaluator` addresses.
