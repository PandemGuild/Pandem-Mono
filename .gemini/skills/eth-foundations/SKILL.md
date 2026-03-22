# Ethereum Foundations

Expertise in the Ethereum protocol, core concepts, and the onchain roadmap. Based on the `ethskills.com` standard.

## Procedural Guidance

### Protocol & Roadmap (`eth-protocol`)
- **EIP Lifecycle**: Track and analyze EIPs (Ethereum Improvement Proposals) through their lifecycle (Draft, Final, etc.).
- **Fork Process**: Analyze the process for hard forks and protocol upgrades (e.g., Pectra/Fusaka).
- **Roadmap Verification**: Verify technical details for Verkle trees, Proto-Danksharding (EIP-4844), and upcoming network upgrades.

### Core Concepts (`eth-concepts`)
- **Incentive Design**: Design and analyze mechanism incentives (game theory) to ensure protocol stability.
- **Incentive Requirement**: Remember that "nothing is automatic" on Ethereum; every action requires a caller and an incentive (gas).
- **Randomness Pitfalls**: Use secure randomness patterns (e.g., Chainlink VRF or Randao) and avoid predictable onchain variables like block hashes for critical logic.
- **Hyperstructures**: Design contracts that are unstoppable, free to use (with no owners), and maintainable.

### Economics & Gas (`eth-gas`)
- **Real-time Gas Analysis**: Estimate and analyze current gas prices (Base Fee vs. Priority Fee).
- **L1 vs L2 Cost Analysis**: Compare deployment and execution costs between Ethereum Mainnet and Layer 2s (Optimism, Arbitrum, Base).
- **Transaction Cost Estimation**: Provide precise gas limit and cost estimates for complex contract interactions.

## Resources
- [Ethereum Improvement Proposals (EIPs)](https://eips.ethereum.org/)
- [Ethereum Roadmap (EthHub)](https://ethhub.io/)
