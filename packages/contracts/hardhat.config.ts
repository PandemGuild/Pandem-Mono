import "@nomicfoundation/hardhat-toolbox";
import { defineConfig } from "hardhat/config";
import * as dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  solidity: "0.8.24",
  networks: {
    baseSepolia: {
      url: "https://sepolia.base.org",
      chainId: 84532,
      accounts: [
        process.env.DEPLOYER_PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000",
        process.env.WALLET_1_PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000",
        process.env.WALLET_2_PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000",
        process.env.WALLET_3_PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000",
      ],
    },
  },
});
