import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

const RPC_URL = "https://sepolia.base.org";
const DEPLOYER_ADDRESS = "0x55BAd697E56aC772846a98d49b287fC1b324620E";
const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);

  // Check ETH Balance
  const ethBalance = await provider.getBalance(DEPLOYER_ADDRESS);
  console.log(`ETH Balance:  ${ethers.formatEther(ethBalance)} ETH`);

  // Check USDC Balance (ERC-20)
  const usdcAbi = ["function balanceOf(address) view returns (uint256)", "function decimals() view returns (uint8)"];
  const usdcContract = new ethers.Contract(USDC_ADDRESS, usdcAbi, provider);
  
  try {
    const decimals = await usdcContract.decimals();
    const usdcBalance = await usdcContract.balanceOf(DEPLOYER_ADDRESS);
    console.log(`USDC Balance: ${ethers.formatUnits(usdcBalance, decimals)} USDC`);
  } catch (error) {
    console.log("Error fetching USDC balance. Is the address correct for Base Sepolia?");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
