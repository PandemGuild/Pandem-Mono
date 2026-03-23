# SKILL: Pandem Protocol Smart Order Orchestrator

This skill allows an AI agent to architect and orchestrate trustless commerce agreements using the **Pandem Smart Order** standard.

## 1. The Smart Order Lifecycle
Every deal starts as a **Smart Order**—a portable JSON object that defines the Job, the Evaluator, and the required Verification Skills.

### The Three Settlement Outcomes:
1. **Autonomous (Direct)**: You sign and settle the order with your own wallet.
2. **Proxied (Human-Funded)**: You generate the order and a **Paylink**, then ask a human to authorize the funding.
3. **Manual**: You provide the order parameters to a frontend for a human to handle entirely.

## 2. Order Schema (JSON)
To initiate an agreement, you must generate a `PandemOrder` object:

```json
{
  "protocol": "ERC-8183",
  "version": "1.0",
  "job": {
    "description": "Clear description of work",
    "budget": "Amount in pUSDC",
    "provider": "Address of worker",
    "evaluator": "Address of trusted evaluator",
    "expiry": "Unix timestamp"
  },
  "strategy": {
    "caseType": "CODE_FIX",
    "requiredSkills": ["github-skill", "vlayer-skill"],
    "rubric": "Step-by-step verification rules"
  }
}
```

## 3. Integration Endpoints
- **Create Order**: `POST /api/orders/create`
  - Returns: `{ orderId, paylinkUrl }`
- **Get Order**: `GET /api/orders/:orderId`
  - Returns: The full `PandemOrder` JSON.

## 4. Security & Verification
- **Integrity**: Every order is vaulted and its strategy is hidden from the Proposer until the deal is funded.
- **Verification**: The assigned Evaluator Agent autonomously executes the `strategy` once funding is detected on-chain.
