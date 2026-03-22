Project Pandem 

This is going to be a full ground-up rewrite — same vision, same voice, but now every technical claim is accurate, every layer is correctly placed, and the architecture reflects the ERC-8183/8004 reality. Let me write it.

Project Pandem
The Reference Evaluator Layer for the Agentic Commerce Internet

Vision Statement
The internet was built for humans to browse, consume, and interact. But as AI agents become our primary digital representatives — executing trades, managing our social deals, running our creative businesses, and forming their own autonomous economic units — the infrastructure underneath them remains fundamentally unchanged. It was built for human hands on keyboards, not machines acting at millisecond velocity.
Project Pandem is built to answer one defining question: When any two entities on the internet — human, agent, or a hybrid of both — want to commit to doing something together, how do they verify that the commitment was honoured, in a way that is credible, enforceable, and trustless?
The answer is not a new escrow contract. That problem was just solved. On March 9, 2026, Virtuals Protocol and the Ethereum Foundation's dAI team published ERC-8183: Agentic Commerce — a minimal, open standard for how agents create jobs, lock funds, submit work, and settle. The escrow state machine is done. The fund flow is done. What ERC-8183 deliberately and explicitly leaves blank is the hardest part: who decides if the work was actually good enough, and how do they prove it on-chain?
Pandem fills that gap — and everything built around filling it well.
It is the internet's reference implementation of the Evaluator role. It is the GitHub of Verification Recipes — a living, public, open-source library of ERC-8183-compatible evaluation strategies that gets smarter with every deal that flows through it. It handles everything from the trivially simple (two friends betting on a football match) to the highly sophisticated (two autonomous agent swarms negotiating a dynamic data-sharing partnership with rolling penalties, ZK-verified deliverables, and DeFi-productive escrow). It is the trust layer that makes ERC-8183 usable by everyone, for everything.

The Problem: A Commerce Standard Without a Brain
ERC-8183 defines a three-party job structure: a Client who locks funds, a Provider who submits work, and an Evaluator who decides if the work meets the agreed standard and calls complete() or reject(). The standard is deliberately minimal. It specifies no negotiation process, no pricing mechanism, no dispute system, no communication channel, and — most critically — no implementation of the Evaluator itself. It leaves the Evaluator as an address. It is up to the ecosystem to make that address smart.
This is the right design. But it creates an immediate problem for every person, business, and agent who wants to use ERC-8183 in practice:
Who writes the Evaluator contract? For anything beyond a binary, on-chain-verifiable outcome, you need an Evaluator that can handle off-chain evidence, API data, ZK proofs, and subjective quality signals. That is not a trivial contract to write.
How is the Evaluator trusted? If each deal uses a bespoke Evaluator contract written by one of the parties, neither side can trust it. The Evaluator needs to be neutral, auditable, and pre-verified.
How are deals negotiated before createJob() is called? ERC-8183 assumes terms are already agreed. It offers no tooling for the negotiation, the intent extraction, the template selection, or the plain-language drafting that makes a deal legible to a non-technical human.
Where does outcome data live? ERC-8183 stores a reason bytes32 hash. The actual evidence — API logs, ZK proofs, screenshots, delivery confirmations — needs a home and a format. Without it, a complete() call is just a signature with no substance behind it.
How do agents discover compatible counterparties? ERC-8004 gives agents an identity and a registry. But reputation — "has this agent completed five data-feed deals without a penalty?" — needs to be written somewhere after completion events, and read somewhere before funding events.
The existing solutions do not solve these problems:
Centralized platforms (Upwork, Fiverr, Escrow.com) extract 10–20% fees, silo reputation, own the dispute resolution process, and are architecturally unavailable to non-human autonomous agents.
Existing on-chain arbitration (Kleros) uses crowdsourced human juries — appropriate for high-value subjective disputes, but far too slow and expensive for the millions of small, fast, agent-executed jobs that ERC-8183 is designed for.
Raw smart contract escrows handle binary verification only. They are entirely blind to whether the code was secure, whether the impressions actually converted, whether the data feed met its SLA.
Informal off-chain agreements have zero enforceability and leave both parties without recourse.
The core gap is this: ERC-8183 gave the internet the escrow primitive. Nobody has yet built the intelligent evaluation, conditional enforcement, negotiation, and public registry layer that makes that primitive useful at scale — for humans and machines alike.
Pandem is that layer.

What Pandem Is
Pandem is a four-component system built directly on top of ERC-8183 and ERC-8004:
1. PandemEvaluator — A family of audited, neutral Evaluator contracts that implement the ERC-8183 IEvaluator interface. Each one is purpose-built for a class of deal: oracle-resolved wagers, GitHub-verified bounties, API-SLA data feeds, ZK-attested document exchanges, and AI-scored creative deliverables. Any ERC-8183 job can designate a PandemEvaluator as its evaluator address at creation time.
2. PandemHooks — A library of conditional enforcement hooks implementing ERC-8183's IACPHook interface. These are the beforeAction and afterAction callbacks that fire at each job state transition. They encode the logic that makes a deal genuinely sophisticated: penalty deductions at interim checkpoints, DeFi routing of idle escrow capital, reputation writes back to ERC-8004 on completion, and Sybil resistance checks at funding time.
3. The Recipe Library — A public, IPFS-indexed registry of complete job configurations: (evaluatorAddress, hookAddress, descriptionTemplate, defaultParams). A recipe is a battle-tested, community-audited combination of a PandemEvaluator and a PandemHook, ready to fork. Creating a new deal becomes selecting a recipe and filling in parameters — the way a developer forks a GitHub template rather than writing from scratch.
4. The Pandem Agent + Explorer — The coordination interface and the public record. The Pandem Agent (accessible via MCP or x402-gated REST API) handles negotiation, recipe selection, job drafting, and monitoring across its full lifecycle. The Explorer indexes every ERC-8183 JobCreated, JobSubmitted, JobCompleted, and JobRejected event enriched with IPFS evidence bundles, surfacing a searchable, human-readable public record of every deal ever settled through Pandem's evaluation layer.

Core Concepts
The Evaluator Role
ERC-8183 defines the Evaluator as the entity that calls complete(jobId, reason) or reject(jobId, reason) on the AgenticCommerce contract after the Provider submits work. The reason field is a bytes32 — a hash of whatever proof bundle was used to make the decision. Pandem's Evaluator contracts make this real:
When a Provider calls submit(), the PandemEvaluator's listener fires. It retrieves the job's verification configuration from IPFS, invokes the appropriate off-chain skill (oracle query, API health check, ZK proof verification, AI analysis), waits for an attested result, and posts complete(jobId, proofBundleHash) or reject(jobId, rejectionReason) back to the base contract. The entire verification trail is IPFS-stored, the proof bundle hash is on-chain, and the outcome is immutable. Every reason hash resolves to a publicly auditable evidence bundle.
Recipes (Complete Job Configurations)
A recipe is a JSON object stored on IPFS that fully describes how to instantiate an ERC-8183 job through Pandem:
json
{
  "recipeId": "api-sla-v2",
  "evaluatorAddress": "0xPandemSLAEvaluator",
  "hookAddress": "0xPandemStreamingHook",
  "descriptionTemplate": "Provider delivers [SERVICE] at [UPTIME_SLA]% uptime for [DURATION] days at [RATE] USDC/day.",
  "defaultParams": { "checkIntervalHours": 4, "penaltyPerDowntimeEvent": 0.02 },
  "successRate": 0.94,
  "completedJobs": 1847,
  "avgSettlementHours": 721
}

When the Pandem Agent matches an intent to this recipe, it fills the parameters through a negotiation conversation, generates the human-readable job description that maps to job.spec in ERC-8183, and hands the completed configuration to the user or agent for deployment. The recipe's successRate and completedJobs are live stats updated after every settlement — the same compounding value that makes a GitHub repository's star count meaningful.
The IACPHook System
ERC-8183 exposes two hook callbacks on every state transition: beforeAction(bytes4 selector, uint256 jobId, bytes calldata data) and afterAction(bytes4 selector, uint256 jobId, bytes calldata data). Pandem's hook library uses these to add everything the base standard intentionally omits:
beforeAction(FUND_SELECTOR) — queries ERC-8004 reputation registry; reverts if provider reputation score is below the recipe's minimum threshold, or reduces required collateral if above a trust tier
afterAction(FUND_SELECTOR) — routes locked funds to a yield strategy (Aave/Compound) for DeFi-productive escrow; funds earn yield for the entire duration of the job
beforeAction(SUBMIT_SELECTOR) — checks interim milestone conditions; if a rolling average is below threshold at Day 4, emits a warning event and freezes a provisional penalty slice before submission is accepted
afterAction(COMPLETE_SELECTOR) — writes a completion attestation back to ERC-8004's Reputation Registry with the job type, outcome, and Pandem recipe ID; this is how Stamps are earned
Human-Readable + Machine-Executable Jobs
Every job deployed through Pandem has its spec field populated with a plain-language description generated by the Pandem Agent and stored on IPFS. This description is not decorative — it is the canonical statement of what was agreed. The evaluatorAddress and hookAddress are the machine-executable enforcement of that same statement. The two are cryptographically linked: the IPFS hash of the human-readable spec is embedded in the job struct at creation time. You cannot modify what the parties agreed to in natural language without creating a new job with a new hash.
This is what allows Pandem to be accessed from a Claude Desktop conversation and enforced on Base. A human reads the plain-language spec and approves. The machine executes the Evaluator.
The Pandem Explorer
The Explorer is an event indexer and front-end over ERC-8183's on-chain history, enriched with Pandem's IPFS metadata layer. For every job ever deployed through a PandemEvaluator:
Job status (Open, Funded, Submitted, Completed, Rejected, Expired) is live
The human-readable spec is indexed and full-text searchable
The evaluator and hook addresses are resolved to their recipe names and versions
The evidence bundle — IPFS-stored proof artifacts, API logs, oracle responses, ZK proof hashes — is permanently linked via the reason bytes32
The settlement outcome and timeline are recorded
The recipe performance stats are updated in real time
For private jobs, ZK proofs replace the actual evidence content. The Explorer shows: "A High-Value Data Exchange Agreement was completed successfully, verified by vlayer TLS proof, settled in 48 hours, zero penalties." The trust signal is public. The commercial details are not.

The Three Types of Participants
Type 1 — Productivity Agents (Human Proxies)
Claude Desktop, ChatGPT, or any MCP-compatible agent acting on behalf of a human. The human describes their intent in natural language: "I want to hire someone to build a smart contract audit tool, pay them $8,000 in three milestones." The Pandem Agent searches the recipe library, selects the github-milestone-v3 recipe, negotiates terms with the counterparty's agent via MCP, generates the human-readable spec, and presents the final job configuration to the human. The human reviews the plain-language summary and clicks "Connect Wallet to Fund." From that point, the PandemEvaluator and hooks handle everything autonomously. The human stays in control; the protocol handles all execution complexity.
Type 2 — Business and Trading Agents
Agents with a specific economic mandate — managing a content distribution network, running an influencer's revenue streams, operating an API marketplace, or executing a DeFi strategy. They consume Pandem's advanced recipes directly, negotiating job parameters autonomously and escalating to their human operators only for high-stakes parameter decisions. They are the primary beneficiaries of the conditional hook system: a business agent managing a 6-month B2B content deal needs autonomous weekly enforcement cycles, rolling penalty logic, and SLA monitoring — all of which PandemHooks delivers without any human intervention after initial deployment.
Type 3 — Autonomous Internet Beings
Self-sustaining agents with their own wallets, ERC-8004 identities, and no human in the operational loop. They discover compatible counterparties on the ERC-8004 registry, negotiate via structured JSON offer/counteroffer over the x402-gated REST API, and fund ERC-8183 jobs using EIP-3009 TransferWithAuthorization signatures — no wallet UI, no human approval. Every Pandem service call — recipe lookup, monitoring heartbeat, ZK verification request — is a paid HTTP interaction under the x402 protocol on Base, making the infrastructure entirely self-funding at the micro level. These agents represent the long-term trajectory of the internet's economic layer.

The Job Lifecycle
Phase 1: Discovery and Intent Matching
Party A's agent hits the Pandem MCP server (human-proxied) or x402 REST endpoint (autonomous) with a natural language description or structured JSON intent. The Pandem Agent embeds the intent and searches the recipe library by semantic similarity, job class, value range, verification type, and privacy mode. It returns the top three matching recipes ranked by success rate and average settlement time. Party A selects or the agent auto-selects based on policy.
Phase 2: Negotiation
For human flows, the Pandem Agent conducts a natural language conversation with both parties, proposing recipe default parameters, flagging non-standard terms, and suggesting precedents from the registry's completed job history. For agent-to-agent flows, this is a JSON offer/counteroffer exchange over MCP, typically resolving in under 10 message turns. The Pandem Agent is not passive — it actively identifies verification gaps ("your deliverable spec is ambiguous for the chosen Evaluator — here is how to make it verifiable"), flags unenforceable clauses, and surfaces the closest historical jobs for reference.
Phase 3: Job Configuration and Signing
Once terms are agreed, the Pandem Agent generates the complete ERC-8183 job configuration:
The spec IPFS hash — the plain-language description of parties, obligations, conditions, and penalties
The evaluatorAddress — the specific PandemEvaluator contract for this job type
The hookAddress — the PandemConditionalHook configured with the agreed enforcement parameters
The budget and expiry — the locked amount and deadline
The privacy configuration — public, redacted, or private ZK mode
Both parties cryptographically sign the job parameters hash before any funds move.
Phase 4: Deployment and Funding
The Client calls createJob() on AgenticCommerce.sol, passing the agreed configuration. The beforeAction(FUND_SELECTOR) hook fires first: it queries ERC-8004 for the Provider's reputation score, applies any trust-tier collateral adjustments, and confirms Sybil resistance via Self Protocol attestation for high-value jobs. Funds lock in the ERC-8183 escrow. For DeFiVault-mode jobs, the afterAction(FUND_SELECTOR) hook immediately routes the locked capital to a yield strategy. The job is now live on the Explorer.
Phase 5: Active Monitoring
The Pandem Agent's monitoring service tracks the job continuously using the Evaluator's configured verification skill. This may involve pinging an API health endpoint every four hours, querying GitHub for commit and PR activity, polling social media APIs for performance metrics, or running scheduled ZK proof verifications. Monitoring is paid per-check via x402 micropayments on Base — the monitoring service is entirely self-funding, with no subscription model or pre-funded account required. Each health check result is appended to the IPFS evidence bundle.
Phase 6: Conditional Enforcement
This is where Pandem transcends what ERC-8183 can do alone. The PandemConditionalHook.beforeAction(SUBMIT_SELECTOR) fires before the Provider is permitted to submit. If interim conditions are not met — a rolling average below threshold, a missed checkpoint, an SLA breach event — the hook can impose provisional penalty deductions on the budget before submission is accepted, emit formal warning events, or block submission entirely if the breach is terminal. All enforcement logic is encoded in the hook at deployment time and executes with zero human intervention. For long-term contracts, this cycle runs autonomously every enforcement period for the full contract term.
Phase 7: Evaluation and Settlement
When the Provider submits, the PandemEvaluator listener fires. The off-chain verification skill runs — oracle query, API aggregation, ZK proof verification, or AI analysis — produces an attested result, and the Evaluator posts complete(jobId, proofBundleHash) or reject(jobId, reason) to the base contract. On completion, the afterAction(COMPLETE_SELECTOR) hook:
Releases funds per the agreed split (optionally via Superfluid streaming for royalties or Sablier for vesting)
Retrieves DeFi yield from the vault and distributes it per the recipe's yield-sharing parameters
Writes a completion attestation to ERC-8004's Reputation Registry, updating the Provider's on-chain track record
Publishes the finalised evidence bundle to the Explorer and updates the recipe's performance statistics

Evaluator Types (Verification Skills)
Oracle Evaluator
Resolves outcomes against Chainlink price feeds, sports data oracles, or any external event oracle. Used for wagers, prediction markets, price-conditional milestone releases, and any binary outcome determinable from a trusted external data source. Resolution is deterministic and requires no off-chain computation beyond the oracle query itself.
SLA Stream Evaluator
For ongoing service agreements — API data feeds, GPU compute time, SaaS subscriptions. The Evaluator pings the Provider's service health endpoint at the configured interval, accumulating verified uptime. Payment stream (via Superfluid) is proportional to verified uptime. Every downtime event is logged to the evidence bundle. At expiry, the Provider receives exactly what was earned, down to the minute. Oracle failure handling: if the health endpoint itself is unreachable, a secondary liveness check against a neutral third-party monitor resolves the ambiguity; if both are down, the stream pauses and a 24-hour human override window opens.
GitHub Milestone Evaluator
For development bounties and open-source grants. Verifies: pull request merge status, test coverage percentage via CI pipeline API, code review approvals from addresses registered in ERC-8004. All three conditions must be met simultaneously for complete() to be called. Partial completion triggers proportional partial release per the milestone recipe configuration.
vlayer ZK Web Proof Evaluator
For deals where the evidence exists on an authenticated website — a signed document on a legal portal, an impression count on a private analytics dashboard, a bank confirmation on a financial platform. The vlayer TLS proof generates a cryptographic attestation that a specific HTTPS response was received from the target server, without revealing the content. The ZK proof hash is the reason stored on-chain. Caveat acknowledged and documented: TLS proofs attest to the data received from a server, not to the veracity of that data if the server itself is compromised or returning fabricated values. Pandem's recipe documentation explicitly states this trust assumption for every ZK-evaluation recipe.
AI Vision + LLM Evaluator
For creative deliverables — design work, written content, code quality assessments, artistic commissions. The Evaluator runs the submitted deliverable through a configured AI evaluation pipeline (Venice.ai for private inference, or a public model for standard jobs) against the style brief and quality criteria encoded in the job spec. The AI returns a structured score against each criterion, which the Evaluator aggregates into a pass/fail determination. Human dispute override is available for AI-evaluated jobs within a 72-hour window post-evaluation.
Composite Evaluator
For complex, multi-signal deals. Combines any of the above: a B2B content deal might require passing both an API impression-count check (SLA Evaluator) AND a brand safety scan (AI Vision Evaluator). All component evaluations must pass for complete() to fire. Partial failures produce proportional penalty outcomes as configured in the hook.

Sample Use Cases
Agent-to-Agent API SLA
An autonomous trading agent discovers a price-feed provider on the ERC-8004 registry. Both agents exchange JSON offers over Pandem's x402 REST endpoint, agreeing on a 30-day deal at $3.50/day with a 99.5% uptime SLA. The Pandem Agent selects the api-sla-v2 recipe. The trading agent calls createJob() with the PandemSLAEvaluator and PandemStreamingHook addresses. 105 USDC locks in escrow; the DeFi hook routes it to Aave while the job runs. The Evaluator pings the feed's health endpoint every four hours via x402-paid calls. Every downtime event pauses the Superfluid payment stream. At Day 30, the provider receives verified earned income, the trading agent receives a refund for unearned days, both agents receive completion attestations on ERC-8004, and the remaining Aave yield is split proportionally. Total human involvement: zero.
Open-Source Bounty Pool
A DAO pools $25,000 in an ERC-8183 job. Any developer can claim the Provider role by registering on ERC-8004 and meeting the minimum reputation score threshold enforced by the beforeAction(FUND_SELECTOR) hook. On submission, the PandemGitHubEvaluator checks: PR merged, test coverage above 90%, three independent security reviewers registered on-chain have approved. On all three conditions satisfied simultaneously, the $25,000 releases. The DAO retains a 14-day dispute override window, after which settlement is irreversible. The completed recipe is published to the Explorer with all GitHub evidence hashes on IPFS.
ZK-Verified Document Exchange
A startup founder needs to prove a signed LOI with a major VC exists before a partnership proceeds, without revealing the VC's identity or terms. The Pandem Agent deploys the zk-document-exchange-v1 recipe: a vlayer TLS proof verifies the document was accessed from the VC's authenticated legal portal, producing a ZK attestation. The counterparty's agent receives the attestation hash, not the document. The ERC-8183 job completes when the counterparty's agent confirms receipt on-chain. The Explorer records: "A Document Authenticity Exchange was completed, verified by vlayer TLS proof, 0 penalties, settled in 6 hours." No content is revealed.
Cross-Platform Creator Collaboration
A YouTube filmmaker and a Spotify podcast host cross-promote over 30 days. Both lock $2,000 each in a DeFiVault-configured ERC-8183 job. The PandemCompositeEvaluator monitors YouTube Analytics and Spotify for Podcasters APIs for click-through rates on UTM-tracked URLs. The PandemConditionalHook encodes: if Day 10 projected performance is below target by more than 15%, a 5% provisional penalty freezes. If Day 20 shortfall exceeds 40%, the full penalty triggers and reject() fires for the underperforming party. If both over-deliver, deposits are returned plus a split of the DeFiVault's 30-day Aave yield.
B2B Agentic Content Partnership
Two companies' agents negotiate a 6-month content distribution deal. Company A's content must achieve a weighted average of 50,000 daily impressions per week on Company B's platform. The PandemConditionalHook encodes the weekly enforcement cycle: Day 4 projection check fires via beforeAction; if actuals 1–3 project more than 15% below weekly target, 10% of the week's payment freezes as provisional penalty; if Day 7 average recovers, penalty releases; if it does not, penalty transfers to Company B. This cycle runs autonomously, every week, for 26 weeks, with zero human intervention after initial deployment.
Private NFT Commission
An anonymous collector commissions a digital artist. The Pandem Agent uses the vision-ai-commission-v1 recipe: Venice.ai runs private inference to compare the artist's portfolio against the agreed style brief before any funds move. The ERC-8183 job uses a three-milestone PandemHook: 30% releases at sketch approval, 30% at linework approval, 40% at final delivery. Identities are ZK-anonymized on the Explorer. The artwork is encrypted on IPFS. The structure and milestone resolutions are public and reusable as a recipe template.
Wager and Prediction Markets
Two users on X want to bet on a match outcome. Their agents describe the wager to the Pandem MCP server. The chainlink-wager-v1 recipe deploys: funds lock in ERC-8183 escrow, the PandemOracleEvaluator queries the Chainlink sports oracle at the agreed settlement time, and complete() fires automatically for the winner. For creators spinning up prediction markets for their followers, the multi-party wager recipe deploys a pooled version with a shareable participation link. All payouts are automatic on oracle resolution.

Privacy Modes
Public Mode
All job specs, wallet addresses, evidence bundles, and settlement data are fully visible on the Explorer. Mandatory for open-source bounties and community DAOs where public verifiability is the point.
Redacted Mode
The Explorer shows the job structure and outcome — "A Cross-Promotion Deal worth $1,000–$10,000 completed with 0 penalties" — but not specific amounts, parties, or deliverable content. Wallet addresses are pseudonymous. The IPFS evidence bundle is encrypted with a key held jointly by the two parties.
Private Mode
Venice.ai handles all LLM inference for negotiation and drafting so contract terms never leave the user's local environment. The ERC-8183 job's spec field stores a ZK commitment to the terms, not the terms themselves. The PandemEvaluator uses Aleo's Leo programs to perform encrypted on-chain verification. The Explorer shows only: "A valid Pandem-standard agreement was executed and completed. ZK proof: 0xabc..." Zero commercial details are revealed to any party outside the two principals.

Token and Access-Gated Economy
Stamps are non-transferable ERC-8004 reputation attestations written by the afterAction(COMPLETE_SELECTOR) hook after every successful Pandem-evaluated job. They are not issued by Pandem — they are written to the public ERC-8004 Reputation Registry by the hook contract, meaning they are trustless and manipulation-resistant. Sybil resistance is enforced by requiring Self Protocol humanity attestation before a Stamp-earning address can be used in a high-value job. Stamps power reputation-tiered escrow: an address holding a "10+ API SLA deals, zero failures" Stamp may be required to post lower collateral because its track record is verifiable on-chain.
Credits are semi-transferable tokens earned by contributing audited, battle-tested recipes to the public library. They are spent to access premium Evaluator skills — vlayer ZK analysis, AI Vision evaluation, composite multi-signal verification. They cannot be purchased with fiat; they are earned by making the ecosystem more useful.
Protocol Tokens are fully transferable governance tokens for community votes on recipe funding priorities, Evaluator contract upgrades, and fee parameter adjustments.
Access Gating: High-performance, enterprise-grade recipe configurations can be gated behind token ownership or reputation Stamp thresholds, creating a market for premium templates without restricting the public base library.

Technical Stack
Layer
Component
Technology
Base Commerce
Job lifecycle, escrow state machine, fund flow
ERC-8183 AgenticCommerce.sol on Base
Identity + Reputation
Agent registry, reputation scores, track record
ERC-8004 registry contracts
Evaluator Contracts
Oracle, SLA, GitHub, ZK, AI, Composite
PandemEvaluator.sol family — IEvaluator implementations
Hook Contracts
Conditional enforcement, DeFi routing, Stamp writing
PandemHooks.sol — IACPHook implementations
Coordination Agent
Natural language negotiation, recipe matching, job drafting
MCP Server (OpenClaw / Claude / GPT-4o)
Autonomous Agent Interface
Agent-to-agent job creation and monitoring
x402 HTTP Payment Protocol on Base
ZK Verification
TLS web proofs, data attestation, private evaluation
vlayer / TLSNotary / Aleo Leo
Privacy Inference
Private LLM contract drafting, AI evaluation
Venice.ai
Oracle Layer
Price feeds, sports data, external event resolution
Chainlink
Streaming Payments
Royalty splits, proportional SLA payouts
Superfluid / Sablier
Productive Escrow
Yield generation on locked capital
Aave / Compound via hook routing
Storage
Evidence bundles, job specs, recipe library
IPFS / Arweave
Identity Verification
Sybil resistance for high-value job participants
Self Protocol
Explorer
Job browsing, recipe library, reputation lookup
Event indexer over ERC-8183 events + IPFS metadata


Business Model
Pandem earns on every evaluation it performs, making it self-sustaining from the first job.
Evaluation Fee: 1–2.5% of job budget, charged at complete() or reject(). Scales with Evaluator complexity: an Oracle Evaluator charges 1%; a Composite ZK + AI Evaluator charges 2.5%. There is a minimum flat fee of $0.50 per evaluation, ensuring micro-value agent-to-agent jobs remain economically viable for the protocol.
Monitoring Fee: Ongoing SLA jobs pay a small x402-denominated fee per health check — typically $0.01–0.05 per ping depending on the verification type. This is paid inline by the job's hook contract from a pre-allocated monitoring reserve within the escrowed budget, requiring no separate payment action.
Premium Recipe Access: Enterprise configurations — composite evaluators, high-frequency SLA monitoring, private ZK evaluation pipelines — are gated behind Credits. One-time credits-denominated license per recipe fork.
Dispute Resolution Premium: Jobs that invoke the AI arbitration layer for contested evaluations pay a flat premium resolution fee, covering the cost of the Venice.ai inference run and the human override window monitoring.

Why Pandem Is the Right Bet Right Now
ERC-8183 launched five days ago. It has zero production Evaluator implementations. It was co-authored by the Ethereum Foundation's dAI team and Virtuals Protocol — the two most credible institutions in the agentic ethereum space. The standard is correct, minimal, and designed for exactly what Pandem fills. The window to become the reference implementation is open right now and will not stay open.
Pandem is not competing with ERC-8183. It completes it. Any developer, DAO, business, or agent who deploys an ERC-8183 job and needs a smart, neutral, auditable Evaluator comes to Pandem's recipe library. Every completed job makes the library more accurate. Every Stamp issued makes reputation more trustworthy. Every recipe published makes the next deal cheaper. The compounding effect is structural, not a marketing claim.
The short-form video changed how humans consumed content. ERC-8183 changed how machines make deals. Pandem changes whether those deals mean anything.


