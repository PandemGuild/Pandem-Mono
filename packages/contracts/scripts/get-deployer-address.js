import { ethers } from "ethers";
import * as dotenv from "dotenv";
dotenv.config();
const DEPLOYER_KEY = process.env.DEPLOYER_PRIVATE_KEY;
if (DEPLOYER_KEY) {
  const wallet = new ethers.Wallet(DEPLOYER_KEY);
  console.log(`DEPLOYER_ADDRESS=${wallet.address}`);
} else {
  console.log("DEPLOYER_PRIVATE_KEY not found in .env");
}
