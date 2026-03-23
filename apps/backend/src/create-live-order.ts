import * as dotenv from "dotenv";

dotenv.config();

const API_URL = "http://localhost:3001";

async function main() {
  console.log("\n--- ARCHITECTING LIVE PANDEM ORDER ---");

  const response = await fetch(`${API_URL}/api/orders/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      job: {
        description: "Zero-Day Buffer Overflow Fix for Pandem-Core Storage Module.",
        budget: "10",
        provider: "0x7083d904291D855Eaf10B707F4238dFF9f017051",
        evaluator: "0x08c3e48c9e7bc28b9e4258e282c43618EF7D50E5",
        expiry: Math.floor(Date.now() / 1000) + 7200
      }
    })
  });

  const { orderId, paylink } = await response.json();
  
  console.log("\n🚀 ORDER ARCHITECTED SUCCESSFULLY!");
  console.log(`🆔 Order ID: ${orderId}`);
  console.log(`🔗 Checkout URL: ${paylink.replace("localhost:5173", "localhost:5173")}`);
  console.log("\nNext Steps:");
  console.log("1. Open the URL in your browser.");
  console.log("2. Connect your wallet.");
  console.log("3. Review the AI-generated Strategic Rubric.");
  console.log("4. Authorize and Fund the escrow.");
}

main().catch(console.error);
