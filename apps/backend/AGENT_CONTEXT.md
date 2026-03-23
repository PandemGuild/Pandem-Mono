# AGENT_CONTEXT: Pandem Evaluator Agent (LangGraph)

## 1. Overview
The Evaluator Agent is an autonomous state machine that verifies ERC-8183 Job submissions. It specializes in GitHub-based bug bounty verification and secure code handover.

---

## 2. Required Environment Variables
- `RPC_URL`: Celo Sepolia RPC endpoint.
- `EVALUATOR_PRIVATE_KEY`: Private key for the evaluator wallet.
- `GITHUB_PAT`: GitHub Personal Access Token for private repo access.
- `PINATA_API_KEY` / `SECRET`: For IPFS storage.
- `HANDOVER_CONTRACT_ADDRESS`: The deployed `AtomicHandover.sol` address.

---

## 3. State Machine Nodes

### Node 1: Ingest & Inspect
- **Inputs**: `jobId` from on-chain event.
- **Action**: Fetch job details from `AtomicHandover`. Parse the description for the GitHub URL.
- **Output**: Repo metadata, `jobId`, `clientAddress`.

### Node 2: Clone & Verification
- **Action**: Use `Octokit` to clone the repo. Run automated tests (e.g., `npm test`).
- **Success Criteria**: All tests pass AND the specific bug fix PR is merged.
- **Output**: Verification report, `isVerified` flag.

### Node 3: Client Preview (Pause Node)
- **Action**: Generate a temporary preview link or proof-of-work summary.
- **Wait**: Wait for Client signature or approval signal.

### Node 4: Finalization & Encryption
- **Action**: Download repository snapshot, ZIP it, upload to IPFS.
- **Encryption**: Generate AES-256 key. Encrypt CID. Store key in local `evaluatorKeyStore`.
- **Output**: `encryptedCID`, `evidenceHash`.

### Node 5: Settlement
- **Action**: Call `complete(jobId, evidenceHash)` on Celo Sepolia.
- **Output**: Transaction hash.

---

## 4. Secure Key Release API
The agent exposes a secure endpoint `/request-key` that releases the decryption key **ONLY IF** the contract status is `Completed` (3).
