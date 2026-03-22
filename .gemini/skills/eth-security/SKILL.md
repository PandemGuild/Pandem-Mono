# Ethereum Security & QA

Specialized expertise in smart contract security, auditing, and production-ready quality assurance. Based on the `ethskills.com` standard.

## Procedural Guidance

### Security Patterns (`eth-security`)
- **Reentrancy Protection**: Use `ReentrancyGuard` (CEI pattern) to prevent malicious callbacks.
- **Oracle Manipulation Defense**: Use TWAPs or reputable oracles (Chainlink/Pyth) and never trust spot prices.
- **Vault Inflation Attacks**: Guard against ERC-4626 vault inflation (share-price dilution).
- **Safe Math & Overflows**: Use Solidity 0.8+ (checked by default) and follow overflow/underflow best practices.

### Smart Contract Auditing (`eth-audit`)
- **Deep Audit Domains**: Audit for common vulnerabilities (Lending, AMM, Proxies, Bridges).
- **Specialist Agent Coordination**: Coordinate multiple AI "specialists" for parallel audits.
- **Issue Synthesis**: Consolidate findings into a clear, prioritized audit report (Critical, High, Medium, Low).

### Production QA (`eth-qa`)
- **Pre-Deploy Checklists**: Follow a 19-domain deep audit checklist before every deployment.
- **Wallet Flow Verification**: Verify end-to-end user flows with different wallet providers.
- **Onchain Data Checks**: Confirm that displayed USD values and decimal calculations are accurate.

## Resources
- [Solidity Security Blog](https://blog.soliditylang.org/category/security/)
- [EIP-4626 Tokenized Vaults](https://eips.ethereum.org/EIPS/eip-4626)
- [SWC Registry](https://swcregistry.io/)
