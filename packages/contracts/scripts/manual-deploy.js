import { ethers } from "ethers";
import * as dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const RPC_URL = "https://sepolia.base.org";
const DEPLOYER_KEY = process.env.DEPLOYER_PRIVATE_KEY;
const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(DEPLOYER_KEY, provider);

  console.log(`Deploying from: ${wallet.address}`);

  // Load ABI and Bytecode from Hardhat artifacts
  const artifactPath = "./artifacts/contracts/AtomicHandover.sol/AtomicHandover.json";
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
  const contract = await factory.deploy(USDC_ADDRESS);

  console.log(`Waiting for deployment... Hash: ${contract.deploymentTransaction().hash}`);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log(`AtomicHandover (Fixed) deployed to: ${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
