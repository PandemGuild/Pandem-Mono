import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

const RPC_URL = "https://sepolia.base.org";
const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
const DEPLOYER_KEY = process.env.DEPLOYER_PRIVATE_KEY;

const WALLETS = [
  "0x7083d904291D855Eaf10B707F4238dFF9f017051", // Wallet 1 (Proposer)
  "0x7781d1F167cCA6a37272eead437f0d876d3059E2", // Wallet 2 (Client)
  "0x08c3e48c9e7bc28b9e4258e282c43618EF7D50E5"  // Wallet 3 (Evaluator)
];

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const deployer = new ethers.Wallet(DEPLOYER_KEY, provider);

  console.log(`Distributing minimal funds from deployer: ${deployer.address}`);

  const usdcAbi = ["function transfer(address, uint256) returns (bool)", "function balanceOf(address) view returns (uint256)", "function decimals() view returns (uint8)"];
  const usdc = new ethers.Contract(USDC_ADDRESS, usdcAbi, deployer);
  const decimals = await usdc.decimals();

  let nonce = await deployer.getNonce();

  for (let i = 0; i < WALLETS.length; i++) {
    const address = WALLETS[i];
    
    // Check if wallet already has ETH
    const ethBalance = await provider.getBalance(address);
    if (ethBalance < ethers.parseEther("0.001")) {
      console.log(`Funding ${address} with 0.001 ETH (Nonce: ${nonce})...`);
      const ethTx = await deployer.sendTransaction({
        to: address,
        value: ethers.parseEther("0.001"),
        nonce: nonce++
      });
      await ethTx.wait();
    } else {
      console.log(`${address} already has ETH.`);
    }

    // Only transfer 1 USDC to the Client (Wallet 2) for the test job
    if (i === 1) {
      const usdcBalance = await usdc.balanceOf(address);
      if (usdcBalance < ethers.parseUnits("1", decimals)) {
        console.log(`Funding Client with 1 USDC (Nonce: ${nonce})...`);
        const usdcTx = await usdc.transfer(address, ethers.parseUnits("1", decimals), { nonce: nonce++ });
        await usdcTx.wait();
      } else {
        console.log(`Client already has USDC.`);
      }
    }
  }

  console.log("Minimal distribution complete!");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
