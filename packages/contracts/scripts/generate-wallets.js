import { Wallet } from "ethers";

console.log("Generating 4 new wallets for Pandem-Project (Celo Sepolia)...");
console.log("-----------------------------------------------------------");

const labels = ["Main Deployer", "Test Wallet 1", "Test Wallet 2", "Test Wallet 3"];

labels.forEach((label) => {
  const wallet = Wallet.createRandom();
  console.log(`${label}:`);
  console.log(`  Address:    ${wallet.address}`);
  console.log(`  PrivateKey: ${wallet.privateKey}`);
  console.log("");
});

console.log("-----------------------------------------------------------");
console.log("CRITICAL: Save these keys securely. Use 'npx hardhat vars set' to set them.");
console.log("Example: npx hardhat vars set DEPLOYER_PRIVATE_KEY");
