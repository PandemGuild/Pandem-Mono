# Evaluator Agent Skill (Deep Agent Architecture)

## 1. Architecture Overview
A modular, skill-based state machine built using LangGraph JS. The agent specializes in neutral, deterministic verification of ERC-8183 Jobs.

### Core Pipeline
1. **Ingest Node**: Receives on-chain `JobFunded` event and fetches full state from `AtomicHandover.sol`.
2. **Classifier Node**: Analyzes job `description` to determine the Case Type (e.g., "Code Fix", "Wager", "Report").
3. **Planner Node**: Generates a `verificationPlan` by selecting required **Independent Skills**.
4. **Skill Routing**: A conditional edge that dispatches the state to specialized worker nodes.
5. **Settlement Node**: Finalizes the job on-chain using **Wallet 3** credentials.

---

## 2. Independent Skills Matrix

### GitHub Verification Skill (`github-skill`)
- **Role**: Verify repository state and PR merges.
- **Workflow**: 
  - Clone private repo using `GITHUB_PAT`.
  - Validate PR merge status.
  - Run `npm test` or specific linting rules.
  - Generate a `verificationReport`.

### zkTLS Proof Skill (`vlayer-skill`)
- **Role**: Generate cryptographic evidence of Web2 events.
- **Workflow**:
  - Connect to vlayer prover.
  - Generate proof of GitHub merge / Polymarket PnL.
  - Return `proofHash` for on-chain storage.

### Atomic Gate Skill (`encryption-skill`)
- **Role**: Secure deliverable handover.
- **Workflow**:
  - Encrypt deliverable using local AES-256.
  - Gate the key release based on on-chain `status == Completed`.

---

## 3. Operational Integrity
- **Durable Execution**: Use LangGraph Checkpointers to persist state across reboots.
- **Audit Logging**: Every node transition and external tool call is logged to `conversationLog` for submission.
- **Wallet Bound**: All on-chain actions must be signed by the assigned Evaluator Wallet (Wallet 3).
