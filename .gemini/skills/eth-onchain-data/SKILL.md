# Ethereum Onchain Interaction & Data

Specialized expertise in interacting with the blockchain, managing identity, and retrieving onchain data. Based on the `ethskills.com` standard.

## Procedural Guidance

### Wallet & Identity Management (`eth-wallets`)
- **Account Abstraction**: Implement and interact with EIP-4337 (Smart Accounts).
- **Multisig Mastery**: Manage Gnosis Safe multisigs and complex permission structures.
- **Secure Key Handling**: Follow rigorous security practices for agent key management (never commit private keys, use ENV variables or KMS).
- **Identity Standards**: Use ENS and ERC-8004 for agent identity.

### Layer 2 Strategy (`eth-l2s`)
- **L2 Landscape Analysis**: Evaluate Arbitrum, Optimism, Base, and ZK-rollups for deployment.
- **Bridging Logic**: Implement cross-chain messaging and bridging patterns (e.g., CCIP, LayerZero).
- **Cross-Chain Strategy**: Manage deployments and state across multiple chains.

### Indexing & Data Retrieval (`eth-indexing`)
- **The Graph & Dune**: Query and analyze onchain data using The Graph (subgraphs) and Dune Analytics.
- **Event Querying**: Efficiently filter and retrieve contract logs (`eth_getLogs`).
- **Data Patterns**: Avoid anti-patterns like block-looping and expensive onchain storage.

## Resources
- [The Graph Docs](https://thegraph.com/docs/en/)
- [Dune Analytics](https://dune.com/)
- [L2Beat](https://l2beat.com/)
