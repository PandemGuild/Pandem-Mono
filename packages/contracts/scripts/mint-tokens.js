import { ethers } from "ethers";
import * as dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const RPC_URL = "https://sepolia.base.org";
const DEPLOYER_KEY = process.env.DEPLOYER_PRIVATE_KEY;
const TOKEN_ADDRESS = "0x405A5bAF6a66319de62ab6A86058dB4829F7487e";

const WALLETS = [
  "0x7083d904291D855Eaf10B707F4238dFF9f017051", // Proposer
  "0x7781d1F167cCA6a37272eead437f0d876d3059E2", // Client
  "0x08c3e48c9e7bc28b9e4258e282c43618EF7D50E5"  // Evaluator
];

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(DEPLOYER_KEY, provider);

  const artifactPath = "./artifacts/contracts/MockERC20.sol/MockERC20.json";
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  const contract = new ethers.Contract(TOKEN_ADDRESS, artifact.abi, wallet);
  const decimals = await contract.decimals();
  const amount = ethers.parseUnits("1000", decimals);

  let nonce = await wallet.getNonce();

  for (const address of WALLETS) {
    console.log(`Minting 1000 pUSDC to ${address} (Nonce: ${nonce})...`);
    const tx = await contract.mint(address, amount, { nonce: nonce++ });
    await tx.wait();
  }

  console.log("Minting complete!");
}

main().catch(console.error);
