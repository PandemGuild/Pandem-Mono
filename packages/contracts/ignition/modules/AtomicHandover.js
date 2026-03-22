import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

export default buildModule("AtomicHandoverModule", (m) => {
  const usdcAddress = m.getParameter("usdcAddress", USDC_ADDRESS);
  const atomicHandover = m.contract("AtomicHandover", [usdcAddress]);

  return { atomicHandover };
});
