import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
const COMMERCE_CONTRACT = "0xb48F841bC8a3B1E148373F2B6436e50A151ABbf7";

export default buildModule("CollateralHookModule", (m) => {
  const usdcAddress = m.getParameter("usdcAddress", USDC_ADDRESS);
  const commerceContract = m.getParameter("commerceContract", COMMERCE_CONTRACT);
  
  const collateralHook = m.contract("CollateralHook", [usdcAddress, commerceContract]);

  return { collateralHook };
});
