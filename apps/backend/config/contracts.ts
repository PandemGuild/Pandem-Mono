export const HANDOVER_CONTRACT_ADDRESS = "0xF2436d6E98EbD303965C3Ef595C3a01B2561a6A4";

export const IACP_ABI = [
  "function createJob(address provider, address evaluator, uint256 expiredAt, string description, address hook) external returns (uint256 jobId)",
  "function setProvider(uint256 jobId, address provider, bytes optParams) external",
  "function setBudget(uint256 jobId, uint256 amount, bytes optParams) external",
  "function fund(uint256 jobId, uint256 expectedBudget, bytes optParams) external",
  "function submit(uint256 jobId, bytes32 deliverable, bytes optParams) external",
  "function complete(uint256 jobId, bytes32 reason, bytes optParams) external",
  "function reject(uint256 jobId, bytes32 reason, bytes optParams) external",
  "function claimRefund(uint256 jobId) external",
  "function jobs(uint256 jobId) external view returns (address client, address provider, address evaluator, uint256 budget, uint256 expiredAt, bytes32 deliverable, uint8 status, string description, address hook)",
  "function nextJobId() external view returns (uint256)"
] as const;
