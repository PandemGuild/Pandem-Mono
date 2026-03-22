import { Octokit } from "@octokit/rest";
import * as dotenv from "dotenv";

dotenv.config();

export interface GitHubVerificationResult {
  isMerged: boolean;
  diff: string;
  report: string;
}

/**
 * GITHUB VERIFICATION SKILL
 * Specifically designed for bug bounty verification.
 */
export class GitHubSkill {
  private octokit: Octokit;

  constructor() {
    const token = process.env.GITHUB_PAT;
    if (!token) {
      console.warn("⚠️ GITHUB_PAT not found in .env. GitHub Skill will run in Mock Mode.");
    }
    this.octokit = new Octokit({ auth: token });
  }

  /**
   * Verifies if a specific bug-fix PR is merged and extracts the diff.
   */
  async verifyPR(owner: string, repo: string, pullNumber: number): Promise<GitHubVerificationResult> {
    if (!process.env.GITHUB_PAT) {
      return this.mockVerify();
    }

    console.log(`[SKILL: GitHub] Verifying PR #${pullNumber} on ${owner}/${repo}...`);

    try {
      // 1. Check Merge Status
      const { data: pullRequest } = await this.octokit.pulls.get({
        owner,
        repo,
        pull_number: pullNumber,
      });

      const isMerged = pullRequest.merged;

      // 2. Fetch Diff (for AI Auditor)
      const { data: diff } = await this.octokit.pulls.get({
        owner,
        repo,
        pull_number: pullNumber,
        headers: { accept: "application/vnd.github.v3.diff" },
      });

      return {
        isMerged: !!isMerged,
        diff: diff as unknown as string,
        report: `PR #${pullNumber} is ${isMerged ? "MERGED" : "OPEN"}. Found changes in ${pullRequest.changed_files} files.`
      };
    } catch (error) {
      console.error("GitHub API call failed:", error);
      throw error;
    }
  }

  private mockVerify(): GitHubVerificationResult {
    return {
      isMerged: true,
      diff: "Mock Diff: + BigInt(nonce) - Number(nonce)",
      report: "MOCK: PR #42 verified as MERGED."
    };
  }
}
