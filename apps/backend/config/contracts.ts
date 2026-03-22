export const HANDOVER_CONTRACT_ADDRESS = "0xF2436d6E98EbD303965C3Ef595C3a01B2561a6A4";

export const IACP_ABI = [
  {
    "inputs": [
      { "name": "provider", "type": "address" },
      { "name": "evaluator", "type": "address" },
      { "name": "expiredAt", "type": "uint256" },
      { "name": "description", "type": "string" },
      { "name": "hook", "type": "address" }
    ],
    "name": "createJob",
    "outputs": [{ "name": "jobId", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "jobId", "type": "uint256" },
      { "name": "provider", "type": "address" },
      { "name": "optParams", "type": "bytes" }
    ],
    "name": "setProvider",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "jobId", "type": "uint256" },
      { "name": "amount", "type": "uint256" },
      { "name": "optParams", "type": "bytes" }
    ],
    "name": "setBudget",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "jobId", "type": "uint256" },
      { "name": "expectedBudget", "type": "uint256" },
      { "name": "optParams", "type": "bytes" }
    ],
    "name": "fund",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "jobId", "type": "uint256" },
      { "name": "deliverable", "type": "bytes32" },
      { "name": "optParams", "type": "bytes" }
    ],
    "name": "submit",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "jobId", "type": "uint256" },
      { "name": "reason", "type": "bytes32" },
      { "name": "optParams", "type": "bytes" }
    ],
    "name": "complete",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "jobId", "type": "uint256" },
      { "name": "reason", "type": "bytes32" },
      { "name": "optParams", "type": "bytes" }
    ],
    "name": "reject",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "name": "jobId", "type": "uint256" }],
    "name": "claimRefund",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "name": "jobId", "type": "uint256" }],
    "name": "jobs",
    "outputs": [
      { "name": "client", "type": "address" },
      { "name": "provider", "type": "address" },
      { "name": "evaluator", "type": "address" },
      { "name": "budget", "type": "uint256" },
      { "name": "expiredAt", "type": "uint256" },
      { "name": "deliverable", "type": "bytes32" },
      { "name": "status", "type": "uint8" },
      { "name": "description", "type": "string" },
      { "name": "hook", "type": "address" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "nextJobId",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
] as const;
