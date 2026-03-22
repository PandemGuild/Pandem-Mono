import hre from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

async function main() {
  const [deployer] = await hre.viem.getWalletClients();
  console.log(`Deploying AtomicHandover with deployer: ${deployer.account.address}`);

  const atomicHandover = await hre.viem.deployContract("AtomicHandover", [USDC_ADDRESS]);

  console.log(`AtomicHandover deployed to: ${atomicHandover.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
