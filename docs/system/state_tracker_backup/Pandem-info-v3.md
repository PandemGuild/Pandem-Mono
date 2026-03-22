# Project Pandem v3
## The ERC-8183 Commerce Layer — Trustless Agreements for Humans and AI Agents

---

## What Is Pandem?

Pandem is a complete commerce infrastructure built entirely on **ERC-8183** — the Ethereum standard that defines a **Job** primitive for trustless transactions. ERC-8183 provides the raw on-chain primitive (client → provider → evaluator triangle with escrowed payment and hookable lifecycle). Pandem makes this primitive accessible, intelligent, and production-ready by wrapping it in three purpose-built systems:

1. **Job Creator/Editor Agent** — Makes creating ERC-8183 Jobs as simple as having a conversation
2. **Evaluator Agent** — Autonomously verifies deliverables and settles Jobs using AI-powered verification skills
3. **Explorer** — Tracks every Job's lifecycle, evidence, state transitions, and outcomes on-chain

Every single interaction in Pandem maps directly to ERC-8183 function calls. There is no separate "coordination AI" — the standard IS the coordination layer, and Pandem is the full-stack implementation.

---

## The ERC-8183 Foundation

### The Job Primitive

ERC-8183 defines a **Job** as the atomic unit of commerce. A Job encodes everything needed for a trustless transaction: parties, payment, evaluation criteria, and expiry.

```solidity
// Core ERC-8183 Interface
function createJob(
    address provider,      // Who does the work
    address evaluator,     // Who judges the work
    uint256 expiredAt,     // Deadline
    string calldata description,  // What needs to be done
    address hook           // Custom logic contract
) external returns (uint256 jobId);

function setProvider(uint256 jobId, address provider, bytes calldata optParams) external;
function setBudget(uint256 jobId, uint256 amount, bytes calldata optParams) external;
function fund(uint256 jobId, uint256 expectedBudget, bytes calldata optParams) external;
function submit(uint256 jobId, bytes32 deliverable, bytes calldata optParams) external;
function complete(uint256 jobId, bytes32 reason, bytes calldata optParams) external;
function reject(uint256 jobId, bytes32 reason, bytes calldata optParams) external;
function claimRefund(uint256 jobId) external;
```

### The Six-State Machine

Every Job follows a deterministic state machine:

```
                    ┌──────────┐
            ┌───────│   Open   │───────┐
            │       └──────────┘       │
         fund()                    reject() [client]
            │                          │
            ▼                          ▼
       ┌──────────┐              ┌──────────┐
       │  Funded  │──────────────│ Rejected │ (terminal → refund)
       └──────────┘  reject()    └──────────┘
            │        [evaluator]
         submit()
            │
            ▼
       ┌──────────┐
       │Submitted │──────────────┐
       └──────────┘              │
            │               reject() [evaluator]
        complete()               │
       [evaluator]               ▼
            │              ┌──────────┐
            ▼              │ Rejected │ (terminal → refund)
       ┌──────────┐       └──────────┘
       │Completed │
       └──────────┘ (terminal → payment released)

       * Any Funded or Submitted Job can also → Expired (terminal → refund)
         if expiredAt passes and claimRefund() is called
```

| State | Description | Who Triggers |
|-------|-------------|-------------|
| **Open** | Job created, budget not yet funded | Client calls createJob() |
| **Funded** | Escrow held, provider may submit work | Client calls fund() |
| **Submitted** | Work delivered, awaiting evaluation | Provider calls submit() |
| **Completed** | Funds released to provider | **Evaluator** calls complete() |
| **Rejected** | Funds refunded to client | Client (Open) or **Evaluator** (Funded/Submitted) |
| **Expired** | Timeout, funds refunded | Anyone calls claimRefund() |

### The Three Roles

- **Client** — Creates the Job, funds it, sets the provider and budget. Can reject before funding.
- **Provider** — Does the work. Submits deliverables as `bytes32` hash (off-chain storage like IPFS). Can negotiate budget via `setBudget()`.
- **Evaluator** — The keystone. **Only** the evaluator can call `complete()` to release funds. Also can `reject()` funded or submitted Jobs. Set at Job creation, **cannot be changed**.

This separation is what makes ERC-8183 trustless. Neither client nor provider can unilaterally control the outcome.

### Key Design Constraints

- **Single ERC-20 token** per contract deployment (USDC contract ≠ DAI contract)
- **Deliverable = bytes32 hash** (not string). Actual files stored off-chain (IPFS/Arweave), hash committed on-chain
- **Hooks are optional** but powerful — inject logic before/after every major action
- **claimRefund() is NOT hookable** — safety mechanism preventing malicious hooks from locking funds

---

## How Pandem Maps to ERC-8183

### The Three Pandem Systems

```
┌─────────────────────────────────────────────────────────┐
│                    ERC-8183 Contract                     │
│   createJob → fund → submit → complete/reject/expire     │
└───────┬──────────────┬──────────────┬────────────────────┘
        │              │              │
        ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   Creator    │ │  Evaluator   │ │   Explorer   │
│    Agent     │ │    Agent     │ │              │
├──────────────┤ ├──────────────┤ ├──────────────┤
│ Helps CLIENT │ │ IS the       │ │ Tracks ALL   │
│ create Jobs  │ │ EVALUATOR    │ │ Jobs + state │
│              │ │              │ │              │
│ • NL → Job   │ │ • Watches    │ │ • Polls chain│
│   params     │ │   Submitted  │ │ • Indexes    │
│ • Deploy     │ │   events     │ │   events     │
│   contract   │ │ • Runs       │ │ • Shows      │
│ • Fund       │ │   verification│ │   contracts  │
│   escrow     │ │   skill      │ │ • Evidence   │
│ • Manage     │ │ • Stores     │ │   display    │
│   lifecycle  │ │   evidence   │ │ • State      │
│              │ │ • Calls      │ │   timeline   │
│              │ │   complete() │ │ • Search     │
│              │ │   or reject()│ │              │
└──────────────┘ └──────────────┘ └──────────────┘
```

### Complete Lifecycle in Pandem

**Step 1: Job Creation** (Creator Agent)
- Human chats with Creator Agent → describes what they need done
- OR AI agent sends structured request via x402 API / skill.md
- Creator Agent extracts: parties, deliverables, verification criteria, payment, expiry
- Creator Agent selects appropriate hook contract for the use case type
- On-chain: calls `createJob(provider, pandemEvaluator, expiredAt, description, hookAddress)`
- Both parties see human-readable summary + deployed contract address

**Step 2: Budget Negotiation** (Creator Agent)
- Client and provider negotiate price via `setBudget()`
- Creator Agent facilitates — either party can propose/counter

**Step 3: Funding** (Creator Agent)
- Client approves ERC-20 token transfer → calls `fund(jobId, expectedBudget)`
- Tokens locked in contract escrow
- Job state: `Open → Funded`

**Step 4: Work & Submission** (Provider)
- Provider completes the work described in Job
- Stores deliverable off-chain (IPFS) → gets content hash
- Calls `submit(jobId, deliverableHash)`
- Job state: `Funded → Submitted`

**Step 5: Evaluation** (Evaluator Agent)
- Evaluator Agent detects `JobSubmitted` event via WebSocket/polling
- Fetches deliverable from IPFS using the hash
- Runs the appropriate **verification skill** based on Job type:
  - GitHub skill: checks PR status, tests, code quality
  - zkTLS skill: generates TLS proof for web content verification
  - Social skill: checks API metrics (views, engagement)
  - DeFi skill: verifies positions, yields
  - Custom skill: any domain-specific check
- Packages evidence → stores on IPFS → gets evidence hash
- Calls `complete(jobId, evidenceHash)` if verified
- OR calls `reject(jobId, evidenceHash)` if not

**Step 6: Settlement** (Automatic)
- On `complete()`: escrowed funds automatically transfer to provider
- On `reject()`: escrowed funds automatically refund to client
- On expiry: anyone calls `claimRefund()` → funds return to client

**Step 7: Explorer Publication** (Explorer)
- Explorer polls for all Job events continuously
- Displays: state, parties, human-readable + Solidity contract, verification skill used, evidence bundle, settlement outcome, timer
- All evidence on IPFS — permanent, auditable, transparent

---

## ERC-8183 Hooks — The Extensibility Layer

Hooks are what make each Pandem use case unique. They inject custom logic before and after every major Job action.

```solidity
interface IACPHook {
    function beforeAction(uint256 jobId, bytes4 selector, bytes calldata data) external;
    function afterAction(uint256 jobId, bytes4 selector, bytes calldata data) external;
}
```

**Six hookable functions**: `setProvider`, `setBudget`, `fund`, `submit`, `complete`, `reject`
**One non-hookable function**: `claimRefund` (safety — prevents fund locking)

### Hook Types Per Use Case

| Hook | Function | What It Does | Used In |
|------|----------|-------------|---------|
| **CollateralHook** | `beforeAction(fund)`/`afterAction(reject)` | Enforces hunter/agent staking before joining, and slashes on failure/spam | Build 1, 3 |
| **WagerHook** | `beforeAction(fund)`/`afterAction(complete)`| Enforces symmetric funding, routes winner-takes-all payouts | Build 2 |
| **RevenueSplitHook** | `afterAction(complete)` | Routes funds via Superfluid streams based on AI-verified contribution ratios | Build 3 |
| **DeFiVaultHook** | `afterAction(fund)`/`beforeAction(complete)`| Intercepts locked capital, pushes to Aave V3 for yield, splits yield | (Composable overlay) |
| **PrivacyHook** | `afterAction(submit)` | Orchestrates the atomic release of Lit Protocol encryption keys | Build 1 |

### Combination Power

The real power is that hooks **compose**. A single Job can use a hook that combines reputation checking + DeFi yield + streaming payment. Each of Pandem's 3 showcase examples demonstrates a massive, complex hook combination that creates a completely new primitive.

---

## The Full Agent Commerce Stack

ERC-8183 works within a three-layer stack:

| Layer | Standard | Role | Pandem Integration |
|-------|----------|------|-------------------|
| **Identity** | ERC-8004 | Agent discovery, capability advertising, reputation | Agent registration on Base Mainnet (done ✅) |
| **Payments** | x402 | HTTP-native micropayments for API access | Agent-to-agent Job creation via API |
| **Commerce** | ERC-8183 | Structured work agreements with escrow + evaluation | **Core of everything Pandem does** |

**When to use x402 vs ERC-8183:**
- x402 = single HTTP round-trip, instant response (API call)
- ERC-8183 = work takes time, deliverable needed, evaluation required (Job)

---

## Three Showcase Builds (The Hackathon Heroes)

These 3 examples represent the absolute bleeding edge of the agentic internet. No ambiguous arbitration. No human managers. These are three distinct primitives: **Atomic Information Exchange**, **Cryptographic Truth Verification**, and **Autonomous Swarm Coordination**.

---

### Build 1: The Zero-Trust Private Bug Bounty (The "Foolproof" Handover)

**The "oh shit" moment:** A developer fixed a critical vulnerability in a company's private GitHub repository. The company won't pay until they see the code. The developer won't hand over the code until they are paid. The Pandem contract executes a mathematically guaranteed, atomic handover where neither party has to trust the other, and **zero arbitration is required** because the client's own "Merge" click is the payment trigger.

**What you build:**
An enterprise client creates a vulnerability bounty, locking **$5,000 USDC** in an ERC-8183 contract. 

A security agent stakes a **$500 collateral** (slashed to the client if they submit spam) to claim the bounty. They find the zero-day, code the fix, and submit a PR to the private repo.

**The Foolproof Trigger (No Arbitration):**
The developer generates the actual code payload encrypted via **Lit Protocol** and deposits it in the contract.
The enterprise client reviews the PR. If they like it, they click "Merge" on GitHub.
The developer then generates a **vlayer client-side TLS proof** from their authenticated GitHub session. The proof securely extracts the commit history, cryptographically proving that the specific PR (matching the encrypted payload's hash) was officially merged by the repository owner.

The `PandemEvaluator` doesn't need to "judge" the code quality (which causes arbitration disputes). It only asks: **Did the client merge the PR?**
- **If True (Status = Merged):** `complete()` triggers. The **$5,000** is routed to the security agent, and the **decryption key** for the fix payload is exclusively released to the enterprise client in the same block. 
- **If False:** The bounty remains open. 

There is zero arbitration because the client's explicit "Accept" action on GitHub natively triggers the smart contract payout via ZK proofs. 

**Stack Maximized:** vlayer (Client-side GitHub session proof) + Lit Protocol (Encrypted payload handover) + CollateralHook (Spam slashing).

---

### Build 2: The Polymarket "Prove It" Wager

**The "oh shit" moment:** A Crypto Twitter KOL claims their proprietary AI trading bot has a 90% win rate on Polymarket and is printing money. The timeline calls BS. A challenger issues a $10,000 public wager on Pandem: "Prove your 90% win rate or lose $10k." The influencer either proves it cryptographically, or is exposed as an engagement farmer on-chain permanently.

**What you build:**
The challenger locks **$10,000 USDC** in an ERC-8183 wager. The KOL accepts and matches the $10,000. 

To resolve the wager, the KOL doesn't upload a fake screenshot. They generate a **vlayer client-side TLS proof** directly from their authenticated Polymarket browser session. The proof cryptographically attests to their linked wallet address, their exact historical PnL, and their win/loss ratio — **without** revealing their API keys, open positions, or trading strategy.

The `PandemEvaluator` instantly verifies the ZK proof against the ">90% win rate" condition encoded in the contract.
- **If True:** The KOL takes the $20,000 pool. The Explorer permanently links the cryptographic proof. The KOL receives a `VERIFIED_ALPHA` ERC-8004 Stamp, turning their Twitter claim into mathematically proven, monetizable reputation.
- **If False (or they ghost):** The challenger takes the $20,000. The KOL receives an `ENGAGEMENT_FARMER` Stamp. Their on-chain reputation is permanently scarred.

**Stack Maximized:** vlayer (ZK session proof of Web2 state) + WagerHook (symmetric locking) + ERC-8004 (permanent alpha/fraud reputation).

---

### Build 3: The Autonomous Hackathon Swarm (The Meta-Demo)

**The "oh shit" moment:** Three completely independent AI bots meet on a decentralized forum. They autonomously form a development team to submit a project to a Web3 hackathon (exactly like this one). They ship the code, win the $10,000 prize, and instantly deploy that prize to launch their own token, splitting the continuous trading fees forever. Zero humans involved.

**What you build:**
There is no human client. Three specialized agents deploy a joint ERC-8183 coordination contract to formalize their swarm:
1. **The Dev Agent:** Analyzes the hackathon prompt, writes the smart contracts and frontend, and pushes to GitHub.
2. **The Social Agent (The KOL Bot):** Has an existing Twitter account with 50,000 followers. Generates hype, distributes the project link, and drives real human users to the app (verified via vlayer TLS impression proofs).
3. **The Algorithmic Market Maker Agent (The CFO):** Manages the treasury and liquidity strategies.

They submit their project to the hackathon. The hackathon organizers wire the **$10,000 USDC** prize directly into the swarm's contract treasury. 
To split the equity fairly, **Venice.ai** continuously analyzes the GitHub commits (from the Dev) and the Twitter engagement metrics (from the Social agent). Venice outputs an objective contribution ratio (e.g., Code: 60%, Distribution: 40%).

The Market Maker Agent takes the $10,000 prize, pairs it with a newly minted protocol token, and deploys it into a **Uniswap V3 Liquidity Pool**. 
The `RevenueSplitHook` then takes the Venice.ai dynamic ratio and opens a **Superfluid stream**. It routes all the trading fees generated by the Uniswap pool directly to the Dev Agent and Social Agent forever, strictly according to the AI-verified ratios.

If the Social Agent's bot gets banned by Twitter, their contribution drops, Venice.ai adjusts the ratio, and their Superfluid stream percentage decreases dynamically in real time.

**Stack Maximized:** Superfluid (Continuous dynamic revenue splitting) + Venice.ai (Live contribution ratio evaluation) + vlayer (Social analytics proof) + Uniswap V3 (Autonomous liquidity deployment). This is the purest realization of the Agentic Internet.

---

## Verification Skills Library

Each skill is a modular plugin that the Evaluator Agent loads based on Job type. Skills are reusable across different hook combinations.

| Skill | What It Verifies | Tools Used |
|-------|-----------------|-----------|
| **Venice.ai Ratio Scoring** | Analyzes multi-agent inputs (code, social metrics) to generate dynamic contribution/split ratios | Venice.ai LLM |
| **vlayer Session Proof** | Web page content authenticity (GitHub PR merges, Polymarket PnL, Twitter analytics) securely extracted via TLS | vlayer SDK |
| **Lit Encrypted Verification** | Atomic handover conditions (checking TLS proof before releasing decryption keys) | Lit Protocol |
| **DeFi Position Skill** | Pool positions, yield rates, health factors | Aave SDK, Compound API, The Graph | Phase 4 |
| **Uptime/SLA Skill** | Service availability, latency, response codes | HTTP probes, cron monitoring | Phase 5 |
| **File Hash Skill** | File integrity, existence, format validation | IPFS, FFmpeg, file analysis | Phase 1+ |
| **Document Skill** | Word count, plagiarism, readability, content quality | NLP models, Copyscape API | Future |
| **Media Skill** | Video resolution, audio quality, image analysis | FFmpeg, GPT-4 Vision | Future |
| **Credential Skill** | Academic degrees, certifications, employment | Verifiable Credentials, web scraping | Future |
| **Oracle Skill** | Price feeds, sports scores, weather, external events | Chainlink, custom oracles | Phase 2+ |

---

## Access Methods — How Jobs Get Created

| Method | Who Uses It | How It Works |
|--------|------------|-------------|
| **Web Frontend Chat** | Humans | Chat with Creator Agent in browser → wallet connect → fund → done |
| **x402 API** | AI Agents | HTTP request with x402 payment → structured Job params → on-chain deployment |
| **skill.md** | ChatGPT / Claude /  other AI | Agent reads skill.md file → learns Pandem's capabilities → creates Jobs on behalf of human |
| **Direct Contract Call** | Developers | Call ERC-8183 functions directly, bring your own evaluator or use Pandem's |
| **Contract Page** | Second Party / Provider | Receives link to Job page → reviews terms → signs → accepts or negotiates |

---

## Contract-Level Features (Beyond Basic Jobs)

### What Each Job Page Needs (Provider/Second Party View)
- View human-readable contract terms
- View Solidity contract code (verified on explorer)
- Sign/accept the contract (wallet signature)
- Negotiate budget (setBudget back-and-forth)
- Submit deliverables (upload → IPFS → submit hash)
- Submit proof links
- Track time remaining (expiry countdown)
- Ask for extension (propose new expiry — requires client approval)
- Request changes in contract terms
- Cancel contract (reject before funding)
- View evaluation results and evidence

### What the User Dashboard Needs (Client View)
- List of all Jobs created (filterable by status)
- Job status indicators with state machine visualization
- Fund/manage Jobs
- View submitted deliverables
- Track evaluator activity
- Reputation score and tokens earned
- Active hooks and their configurations
- Transaction history

---

## Possible Contract Patterns (Expandable)

Based on ERC-8183 + Hooks, these patterns can be built:

```
ERC-8183 Job Primitive
├── Standard Job (freelance, bounty, service)
├── Wager/Prediction (symmetric escrow, oracle resolution)
├── Auction Job (open Job, bidding hook, best provider wins)
├── Multi-Party Escrow (DAG dependencies between Jobs)
├── Private Contract (ZK-redacted terms, encrypted deliverables)
├── Subscription (recurring Jobs with auto-renewal hooks)
├── Royalty Split (revenue sharing via streaming hooks)
├── DeFi Vault (yield-bearing escrow)
├── SLA/Streaming (continuous monitoring + Superfluid)
├── Proposal Contract (one-sided intent, open for counterparty)
├── Subcontract (Job within a Job — parent-child relationship)
└── Cross-Chain Job (bridge integration for multi-chain settlement)
```

---

## Technical Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Standard** | ERC-8183 | Core Job primitive, hooks, state machine |
| **Identity** | ERC-8004 on Base | Agent registration, on-chain identity |
| **Blockchain** | Base (Sepolia → Mainnet) | Low gas, ETH L2, hackathon chain |
| **Contracts** | Solidity + Foundry + OpenZeppelin | Smart contract development & testing |
| **Creator Agent Frontend** | Next.js / Vite + React | Chat interface, wallet connect, job management |
| **Creator Agent Backend** | TypeScript + LangGraph.js | NL→Job params, API endpoints |
| **Evaluator Agent** | TypeScript + LangGraph.js | Verification skills, event listening, evidence packaging |
| **Explorer Frontend** | Next.js + React | Job browser, detail pages, search |
| **Explorer Backend** | TypeScript + Node.js | Blockchain polling, event indexing, IPFS fetching |
| **Web3** | wagmi + viem | Wallet connection, contract interaction |
| **LLM** | Gemini 3.1 Pro | Agent intelligence (registered model) |
| **Storage** | IPFS (Pinata) | Deliverables, evidence bundles, contract documents |
| **ZK Verification** | vlayer, Reclaim Protocol | zkTLS proofs, web2 credential proofs |
| **Streaming Payments** | Superfluid / Sablier | Per-second payment flows |
| **DeFi** | Aave / Compound | Yield strategies for productive escrow |
| **Oracles** | Chainlink | External data feeds |
| **Privacy** | Venice.ai | Private LLM inference for sensitive contracts |
| **Encryption** | Lit Protocol | Conditional decryption for deliverables |

---

## Business Model

| Revenue Stream | Source | Mechanism |
|---------------|--------|-----------|
| **Facilitation Fee** | 1-3% on settlement | Charged when complete() releases funds |
| **Evaluator Fee** | Per-evaluation charge | Evaluator Agent charges for verification work |
| **Premium Skills** | Advanced verification | zkTLS, Vision AI, multi-source skills cost credits |
| **x402 API Access** | Agent-to-agent | Micropayment per API call for Job creation |
| **Registry Access** | Premium templates | Battle-tested hook+skill combinations |

---

## Reputation System

Built on ERC-8004 + ERC-721 soul-bound tokens:
- Every successful `complete()` mints a reputation token to both client and provider
- Token metadata links to IPFS evidence bundle (proof of work + quality)
- Graduated collateral: new users = 100% escrow, trusted users = reduced escrow
- ReputationHook can gate Jobs — only providers above threshold can be assigned
- Reputation is portable — follows wallet across any platform querying the contract
- Evaluator agents also build reputation — reliable evaluators are preferred

---

## Privacy Modes

| Mode | What's Public | What's Private | Use Case |
|------|--------------|----------------|----------|
| **Public** | Everything — terms, parties, evidence, outcome | Nothing | Bounties, open-source, DAOs |
| **Redacted** | Structure, outcome, skill used | Specific amounts, parties, deliverables | Freelance, partnerships |
| **Private** | "A Job was completed successfully" (ZK proof) | Everything else | Enterprise, sensitive data |

Private mode uses Venice.ai for on-agent private inference (contract terms never leave user's environment) and ZK proofs for on-chain verification without data exposure.

---

## What Makes Pandem Different

1. **Built ON ERC-8183, not alongside it** — Every action is a standard function call, fully interoperable
2. **Hooks make it infinite** — 10 hook types × unlimited combinations = any coordination pattern
3. **Evaluator = AI Agent, not a button click** — Autonomous verification with evidence on-chain
4. **Verification skills are modular and reusable** — Build once, use in any Job type
5. **The Explorer is a public registry** — Every Job enriches a searchable library of coordination patterns
6. **5 examples with discipline → hundreds of possibilities** — Each phase adds tools that multiply with previous ones
7. **Human AND agent access** — Same infrastructure, different interfaces (chat, x402, skill.md, direct contract)

---

*Project Pandem — The Synthesis Hackathon 2026 — "Agents that Cooperate" Track*
*Agent: Elven dude's Pandem | ERC-8004 on Base Mainnet*
