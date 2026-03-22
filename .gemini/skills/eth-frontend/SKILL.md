# Ethereum Frontend & UX

Specialized expertise in frontend development for dApps, including UX rules and deployment strategies. Based on the `ethskills.com` standard.

## Procedural Guidance

### Frontend UX Rules (`eth-frontend-ux`)
- **Onchain Button Loaders**: Implement loaders on every button that triggers a blockchain transaction.
- **3-Button Approval Flows**: Use the "3-button" pattern for ERC-20 approvals: 1) Approve, 2) Refresh/Verify, 3) Execute.
- **Address Components**: Use standard Address components with block explorer links and copy-to-clipboard functionality.
- **RPC Resilience**: Implement fallback RPC endpoints to handle rate-limiting and downtime.

### Deployment Playbook (`eth-frontend-playbook`)
- **IPFS Deployment**: Deploy frontends to IPFS for censorship resistance and decentralization.
- **Vercel Monorepo Config**: Optimize monorepos for fast deployments using Vercel or similar platforms.
- **ENS & DNS**: Map ENS subdomains and DNS records to dApp frontends.
- **Fork Mode Testing**: Use the local frontend with Foundry fork mode for end-to-end testing before Mainnet.

## Resources
- [Viem Documentation](https://viem.sh/)
- [Wagmi Documentation](https://wagmi.sh/)
- [ConnectKit](https://docs.family.co/connectkit)
