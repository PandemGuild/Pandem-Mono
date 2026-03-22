import { ethers } from "ethers";
import * as dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const RPC_URL = "https://sepolia.base.org";
const DEPLOYER_KEY = process.env.DEPLOYER_PRIVATE_KEY;

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(DEPLOYER_KEY, provider);

  console.log(`Deploying MockERC20 from: ${wallet.address}`);

  const artifactPath = "./artifacts/contracts/MockERC20.sol/MockERC20.json";
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
  
  // Deploy with: Name, Symbol, Decimals
  const contract = await factory.deploy("Pandem Mock USDC", "pUSDC", 6);

  console.log(`Waiting for deployment... Hash: ${contract.deploymentTransaction().hash}`);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log(`MockERC20 deployed to: ${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
