import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_API_KEY not found");

  console.log("Checking available Gemini models...");
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.models) {
    console.log("Available Models:");
    data.models.forEach((m: any) => {
      if (m.supportedGenerationMethods.includes("generateContent")) {
        console.log(` - ${m.name} (${m.displayName})`);
      }
    });
  } else {
    console.error("Error fetching models:", data);
  }
}

main().catch(console.error);
