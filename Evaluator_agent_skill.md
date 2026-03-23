Here is the complete brief document you can paste directly into your agent, followed by all the links it'll need.

***

## PANDEM_EVALUATOR_AGENT_BRIEF.md

Below is the exact feed-ready document:

***

```markdown
# PANDEM — Evaluator Agent Brief
## For: apps/backend/evaluator/

---

## 1. Context & Role

Project Pandem is the reference implementation of the ERC-8183 Agentic Commerce
standard. ERC-8183 defines a state machine: Open → Funded → Submitted → Complete/Rejected.

The Evaluator Agent is the ONLY entity authorized to call `complete()` or `reject()`
on the AtomicHandover contract once a job is in `Submitted` state. It is a neutral,
autonomous third party — not the client, not the provider.

The evaluator's on-chain identity is a wallet address (EOA or smart contract).
Its intelligence is off-chain. It watches for `JobSubmitted` events, runs the
appropriate verification skill, produces a SCORE, and then settles on-chain.

---

## 2. The Scoring Model (fits into ERC-8183 `reason` field)

ERC-8183 allows passing a `bytes reason` to complete() and reject().
We use this to store a structured evidence hash. The agent must produce:

```ts
type EvaluationResult = {
  jobId: bigint;
  score: number;           // 0–100. >= threshold → complete(), else reject()
  threshold: number;       // Default: 70. Can be overridden per job.
  verdict: "PASS" | "FAIL";
  evidenceHash: string;    // keccak256 or IPFS CID of the full evidence object
  skillUsed: string;       // e.g. "github-v1", "llm-judge-v1", "zk-tls-v1"
  reasoning: string;       // Short LLM-generated summary (stored off-chain)
}
```

The `reason` bytes passed on-chain = `keccak256(abi.encode(evidenceHash, skillUsed, score))`.
This feeds into ERC-8004 reputation — every evaluator decision is traceable.

---

## 3. Architecture — Skill-Based Evaluator

```
evaluator-core.ts           ← Event listener (Celo Sepolia / target chain)
      │
      ├── reads JobSubmitted(jobId, provider, deliverableHash, description)
      │
      └── skill-router.ts   ← Routes to correct skill based on job metadata
                │
                ├── skills/github.ts       → clone repo, run tests, verify PR merge
                ├── skills/llm-judge.ts    → LLM scores creative/qualitative work
                ├── skills/vlayer.ts       → ZK-TLS web2 session attestation
                └── skills/zk-proof.ts    → verify on-chain ZK proof submission
```

Each skill is a standalone async function:
```ts
type Skill = (job: JobContext) => Promise<EvaluationResult>
```

The LangGraph graph wraps the execution of a skill with:
- State management (what step am I on)
- Conditional edges (did verification pass? → complete or → retry once)
- Human-in-the-loop interrupt (optional: pause for human escalation)
- Retry logic with exponential backoff

---

## 4. LangGraph Graph Design

### State
```ts
const EvaluatorState = Annotation.Root({
  jobId: Annotation<bigint>,
  deliverableHash: Annotation<string>,
  description: Annotation<string>,
  skillName: Annotation<string>,
  evidenceRaw: Annotation<Record<string, unknown>>,
  score: Annotation<number>,
  verdict: Annotation<"PASS" | "FAIL" | "PENDING">,
  retryCount: Annotation<number>,
  error: Annotation<string | null>,
});
```

### Nodes
1. `routeSkill` — reads description, sets `skillName`
2. `executeSkill` — calls the selected skill, populates `evidenceRaw` + `score`
3. `scoreGate` — conditional: score >= threshold → `settleOnChain`, else `handleFail`
4. `settleOnChain` — calls contract `complete(jobId, reasonBytes)`
5. `handleFail` — retries once, then calls `reject(jobId, reasonBytes)`
6. `humanEscalation` (optional) — `interrupt()` node, awaits human override

### Edges
```
START → routeSkill → executeSkill → scoreGate
scoreGate → [PASS] → settleOnChain → END
scoreGate → [FAIL, retry < 1] → executeSkill
scoreGate → [FAIL, retry >= 1] → handleFail → END
```

---

## 5. The Evaluator Is Generic

The same evaluator core handles ALL job types in Pandem:
- Bug bounty (github skill)
- Skill duel / wager (llm-judge skill)
- Content delivery (llm-judge skill)
- ZK-attested Web2 work (vlayer skill)
- Any future ERC-8183 job (add new skill file, register in router)

Job type is determined by a `category` field in the job `description` JSON
or via a separate `jobMetadata` IPFS CID stored at creation time.

---

## 6. File Structure

```
apps/backend/
  evaluator/
    evaluator-core.ts      ← chain listener + event handler
    skill-router.ts        ← routes jobId → skill
    graph.ts               ← LangGraph StateGraph definition
    settle.ts              ← on-chain complete()/reject() caller
    types.ts               ← shared types (EvaluationResult, JobContext, etc.)
    skills/
      github.ts
      llm-judge.ts
      vlayer.ts
      zk-proof.ts
```

---

## 7. Environment Variables Required

```env
PRIVATE_KEY=                     # Evaluator wallet private key
RPC_URL=                         # Celo Sepolia RPC
CONTRACT_ADDRESS=                # AtomicHandover deployed address
GEMINI_API_KEY=                  # For llm-judge skill
GITHUB_TOKEN=                    # For github skill (private repo access)
LANGSMITH_API_KEY=               # Optional: tracing/observability
SCORE_THRESHOLD=70               # Default pass threshold
POLL_INTERVAL_MS=5000            # Block polling interval
```

---

## 8. Install Commands

```bash
npm install @langchain/langgraph@latest
npm install langchain@latest
npm install @langchain/core@latest
npm install @langchain/google-genai    # Gemini
npm install @langchain/langgraph-sdk  # If using LangGraph server
npm install viem                       # On-chain calls (already in repo)
npm install zod                        # State schema validation
```

---

## 9. Key Reference Links

- LangGraph JS Overview:   https://docs.langchain.com/oss/javascript/langgraph/overview
- LangGraph JS Install:    https://docs.langchain.com/oss/javascript/langgraph/install
- LangGraph Skills Docs:   https://docs.langchain.com/oss/javascript/langchain/multi-agent/skills
- LangGraph GitHub (JS):   https://github.com/langchain-ai/langgraphjs
- Agents from Scratch TS:  https://github.com/langchain-ai/agents-from-scratch-ts
- LangChain v1 Changes:    https://docs.langchain.com/oss/javascript/releases/langchain-v1
- Changelog (latest):      https://docs.langchain.com/oss/javascript/releases/changelog
- @langchain/langgraph npm: https://www.npmjs.com/package/@langchain/langgraph  (v1.2.5)
- langchain npm:            https://www.npmjs.com/package/langchain              (v1.2.36)
- ERC-8183 Spec:            https://eips.ethereum.org/EIPS/eip-8183

---

## 10. First Task for Agent

Read this document fully. Then:
1. Create `apps/backend/evaluator/types.ts` with EvaluationResult, JobContext types
2. Create `apps/backend/evaluator/skills/github.ts` — the github verification skill
3. Create `apps/backend/evaluator/graph.ts` — the LangGraph StateGraph
4. Create `apps/backend/evaluator/evaluator-core.ts` — the event listener
5. Wire everything in `apps/backend/evaluator/index.ts`
Start with types.ts. Ask me to confirm the AtomicHandover ABI and contract address
before writing settle.ts.
```

***

## Key Package Versions (as of March 2026)

| Package | Latest | Install |
|---|---|---|
| `@langchain/langgraph` | **1.2.5**  [npmjs](https://www.npmjs.com/package/@langchain/langgraph) | `npm i @langchain/langgraph@latest` |
| `langchain` | **1.2.36**  [npmjs](https://www.npmjs.com/package/langchain) | `npm i langchain@latest` |
| `@langchain/langgraph-sdk` | **1.8.0**  [npmjs](https://www.npmjs.com/package/@langchain/langgraph-sdk) | `npm i @langchain/langgraph-sdk` |
| `@langchain/core` | latest  [docs.langchain](https://docs.langchain.com/oss/javascript/releases/changelog) | `npm i @langchain/core@latest` |
| `@langchain/google-genai` | latest  [docs.langchain](https://docs.langchain.com/oss/javascript/releases/changelog) | `npm i @langchain/google-genai` |

LangGraph v1.0+ dropped the `langgraph.prebuilt` module — that functionality moved into `langchain.agents`. The `Annotation.Root()` pattern with Zod schemas is now the standard state definition. Your agent should use `StateGraph(EvaluatorState)` not the old channel-based approach. [docs.langchain](https://docs.langchain.com/oss/javascript/releases/changelog)

The scoring model embedded in the `reason` bytes is the most important architectural decision here — it's what makes every evaluator verdict **auditable on-chain** and feeds directly into the ERC-8004 reputation layer that Pandem is building toward. [perplexity](https://www.perplexity.ai/search/f92f5f8a-42fd-420f-aa47-05159636beef)