# Evaluator Agent Architecture & Context

## Overview
The Evaluator is an autonomous LangGraph agent acting as a neutral mediator in an `AtomicHandover` workflow. Based on EIP-8183 principles, the Evaluator listens to on-chain events, validates off-chain code submissions via a private repository and a live deployment preview, and brokers the handover by interacting with the smart contracts.

## Smart Contract Integration Specs

### Identity & Permissions
- The Evaluator acts via an Externally Owned Account (EOA) or a secure key-management service (e.g., Lit Protocol PKPs) which corresponds to the `evaluator` address on the `AtomicHandover` contract.
- **Authorized Functions**: The Evaluator is the **only** entity authorized to call `complete()` and `reject()` when the Job is in `Funded` or `Submitted` state.

### On-Chain Event Triggers (What to watch)
1. **`JobCreated(uint256 jobId, address client, address provider, address evaluator, uint256 expiredAt, address hook)`**
   - *Action*: Register the job in the agent's internal database (or memory) if `evaluator` matches the Agent's address.
2. **`JobFunded(uint256 jobId, address client, uint256 amount)`**
   - *Action*: Note that the client has escrowed the bounty. Wait for the provider to submit the deliverable.
3. **`JobSubmitted(uint256 jobId, address provider, bytes32 deliverable)`**
   - *Deliverable*: Expected to be a hash or identifier pointing to the GitHub repo/deployment link.
   - *Action*: **Trigger the Verification Engine.** 

### On-Chain Executions (What to write)
Based on the verification outcome, the agent must construct and sign one of the following transactions:

1. **Success (Fix verified & Client Approves Preview)**
   ```solidity
   function complete(uint256 jobId, bytes32 reason, bytes calldata optParams)
   ```
   - *Impact on `AtomicHandover`*: Status transitions to `Completed`. The `budget` is transferred to the `provider`.
   - *Impact on `CollateralHook`*: The Provider's $500 collateral is returned to them.

2. **Failure (Fix fails, or malicious code detected, or Client rejects for valid reason)**
   ```solidity
   function reject(uint256 jobId, bytes32 reason, bytes calldata optParams)
   ```
   - *Impact on `AtomicHandover`*: Status transitions to `Rejected`. The `budget` is returned to the `client`.
   - *Impact on `CollateralHook`*: The Provider's $500 collateral is **slashed** and transferred to the `client`.

*Note: Since the EIP-8183 architecture separates the reason as a `bytes32`, the agent can encode specific failure codes into `reason` (e.g., `0x01` for validation failure vs `0x02` for client backing out). However, in `CollateralHook.sol`, any `reject()` call currently slashes the collateral to the client.*

---

## The AI Evaluator Pipeline (LangGraph)

The LangGraph State Machine requires the following nodes:

### Node 1: Ingestion & Parsing
- Listens to the `JobSubmitted` event.
- Parses the `deliverable` payload (could be IPFS CID containing encrypted environment info: GitHub Repo URL, Deployment URL, Proposer's Lit Conditions).

### Node 2: Clone & Inspect
- **Inputs**: Private GitHub Repo URL, GitHub PAT (from agent env).
- **Actions**:
  - Clone codebase to ephemeral sandbox.
  - Run static analysis to ensure no malicious backdoors or obvious exploit vectors were added by the provider.

### Node 3: Verification Engine
- **Actions**:
  - Spin up local tests (e.g., `npm run test` or `forge test`) based on project specs to ensure the requested bug is patched.
  - Test the live deployment URL (provided by the proposer) to ensure functionality in a production-like setting.

### Node 4: Client Preview Step (Website Verification)
- **Actions**:
  - Pause the agent via LangGraph `interrupt`.
  - Send the live deployment link to the Client as "Proof of Work" for visual/manual confirmation.
  - Wait for `Client_Approval` or `Client_Rejection` signal.

### Node 5: Finalization & Sealing (If Approved)
- **Actions**:
  - Download the exact codebase corresponding to the verified deployment instance to prevent bait-and-switch.
  - ZIP the codebase and upload directly to a Filecoin bucket (e.g., via Lighthouse or Web3.Storage).
  - Obtain the IPFS CID of the codebase.
  - Encrypt the IPFS CID (using Lit Protocol) so that only the Client's address can decrypt it.

### Node 6: On-Chain Settlement
- **If Step 3, 4, or 5 Fails**:
  - Execute transaction: `AtomicHandover.reject(jobId, failureReason, "")`.
  - Outcome: Client gets bounty back, Provider loses collateral.
- **If Approved & Sealed**:
  - Execute transaction: `AtomicHandover.complete(jobId, successReason, "")`.
  - Outcome: Provider gets bounty and collateral back; Client gets full ownership of Filecoin data via Lit.

## Required Environment & Infra
- **Agent Keys**: Private key loaded with native gas tokens (ETH/MATIC/OP) to call the contract.
- **GitHub**: `GITHUB_PAT` to clone private repos.
- **Storage**: `LIGHTHOUSE_API_KEY` or `WEB3_STORAGE_TOKEN`.
- **Lit Protocol**: Lit Node client configured to mint Access Control Conditions (ACC) locked to the Client's EVM address.
