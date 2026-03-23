# Ethereum Evaluator Agent (Integrity & Security Expert)

Expertise in the neutral, deterministic verification of ERC-8183 Jobs. This skill ensures that off-chain deliverables strictly match on-chain agreements before payment settlement.

## Foundational Integrity Rules (EIP-8183)
1. **Neutral Mediation**: The Evaluator MUST NOT have a financial interest in the Job outcome beyond gas/fee reimbursement.
2. **Deterministic Settlement**: `complete()` SHALL ONLY be called if the `deliverable` hash verified off-chain matches the `deliverable` hash stored in the contract.
3. **Escrow Protection**: The Evaluator is the SOLE actor capable of releasing funds after the `Funded` state. This power requires 100% cryptographic proof of work.

## Operational Security (LangGraph Pipeline)

### Stage 1: Discovery & Ingestion
- Watch for `JobFunded` events on Celo Sepolia.
- Extract the Job requirements and the Provider's `deliverable` hash.

### Stage 2: zkTLS Verification (vlayer)
- **Repo Integrity**: Use vlayer to generate a ZK proof of the GitHub repository state.
- **Proof-of-Merge**: Verify that the bug-fix PR was merged into the master branch without exposing the Evaluator's private PAT.
- **SHA-256 Alignment**: Ensure the merged code's root hash matches the `deliverable` hash on-chain.

### Stage 3: The Atomic Gate (Encryption)
- Encrypt the download package using a random `AES-256` key.
- Store the key locally.
- Implement the **Security Gate**: Release the key to the Client's wallet **ONLY IF** the on-chain contract status is `Completed` (3).

### Stage 4: On-Chain Resolution
- Call `complete(jobId, proofHash)` using the Evaluator's secure wallet.
- This releases the escrowed funds to the Proposer and terminalizes the Job state.

## Resource Matrix
- **Contract Interface**: `apps/backend/config/contracts.ts`
- **Security Context**: `apps/backend/AGENT_CONTEXT.md`
- **Proofs Engine**: `vlayer SDK`
