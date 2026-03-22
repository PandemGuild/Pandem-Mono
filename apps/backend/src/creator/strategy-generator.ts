import { ChatGoogle } from "@langchain/google";
import * as dotenv from "dotenv";

dotenv.config();

export interface VerificationStrategy {
  caseType: string;
  requiredSkills: string[];
  rubric: string;
  confidence: number;
}

/**
 * STRATEGY GENERATOR (Creator Agent Brain)
 * Uses Gemini to synthesize a high-integrity verification rubric.
 */
export class StrategyGenerator {
  private model?: ChatGoogle;

  constructor() {
    if (process.env.GOOGLE_API_KEY) {
      this.model = new ChatGoogle({
        model: "gemini-2.0-flash", // Using fast reasoning model
        apiKey: process.env.GOOGLE_API_KEY,
      });
    } else {
      console.warn("⚠️ GOOGLE_API_KEY not found. Strategy Generator will use Mock Mode.");
    }
  }

  /**
   * Generates a verification strategy based on user intent.
   */
  async generate(intent: string): Promise<VerificationStrategy> {
    if (!this.model) {
      return this.mockGenerate(intent);
    }

    const prompt = `
      You are the Pandem Strategic Architect. Your role is to design a high-integrity 
      verification rubric for a trustless bug bounty agreement.

      Human Intent: "${intent}"

      Identify the Case Type and define the exact success criteria (Rubric) the Evaluator 
      must check. Output strictly in JSON format with these fields:
      {
        "caseType": "CODE_FIX" | "WAGER" | "SWARM",
        "requiredSkills": ["github-skill", "vlayer-skill", ...],
        "rubric": "A detailed security checklist",
        "confidence": 0.0 to 1.0
      }
    `;

    try {
      const response = await this.model.invoke(prompt);
      // Simple parse (in production we'd use StructuredOutputParser)
      return JSON.parse(response.content as string);
    } catch (error) {
      console.error("AI Generation failed, falling back to mock:", error);
      return this.mockGenerate(intent);
    }
  }

  private mockGenerate(intent: string): VerificationStrategy {
    console.log("[MOCK] Generating high-integrity rubric for intent:", intent);
    return {
      caseType: "CODE_FIX",
      requiredSkills: ["github-skill", "vlayer-skill"],
      rubric: "1. PR must be merged. 2. Fix must use BigInt for nonces. 3. No new vulnerabilities.",
      confidence: 1.0
    };
  }
}
