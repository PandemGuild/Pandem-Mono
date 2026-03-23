import * as dotenv from "dotenv";

dotenv.config();

const API_URL = "http://localhost:3001";

async function main() {
  console.log("--- TESTING UNIFIED SMART ORDER PROTOCOL ---");

  // 1. AGENT ACTION: Create Order
  console.log("1. Agent creating a Smart Order via API...");
  const orderResponse = await fetch(`${API_URL}/api/orders/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      job: {
        description: "Verify critical security patch for Pandem-Vault.",
        budget: "50",
        provider: "0x7083d904291D855Eaf10B707F4238dFF9f017051",
        evaluator: "0x08c3e48c9e7bc28b9e4258e282c43618EF7D50E5",
        expiry: Math.floor(Date.now() / 1000) + 7200
      }
    })
  });

  const { orderId, paylink } = await orderResponse.json();
  console.log(`🟢 Order Created! ID: ${orderId}`);
  console.log(`🟢 Paylink for Human: ${paylink}`);

  // 2. HUMAN ACTION: Simulate Funding & Linking
  // In a real scenario, the human funds on-chain, and then the app links them.
  const mockJobId = 999n;
  console.log(`\n2. Simulating Human funding Job #${mockJobId} on-chain...`);
  
  const linkResponse = await fetch(`${API_URL}/api/orders/${orderId}/link`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jobId: mockJobId.toString() })
  });
  
  const linkResult = await linkResponse.json();
  console.log(`🟢 ${linkResult.status.toUpperCase()}: Order linked to blockchain.`);

  // 3. VERIFICATION
  const finalOrderResponse = await fetch(`${API_URL}/api/orders/${orderId}`);
  const finalOrder = await finalOrderResponse.json();
  console.log(`\n3. Final Order State:`);
  console.log(`   On-Chain Job ID: ${finalOrder.onChainJobId}`);
  console.log(`   Strategy Rubric: ${finalOrder.strategy.rubric.substring(0, 50)}...`);

  console.log("\n--- TEST COMPLETE: UNIFIED FLOW PROVEN ---");
}

main().catch(console.error);
