import { Octokit } from "@octokit/rest";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const o = new Octokit({ auth: process.env.GITHUB_PAT });
  console.log("Fetching PRs for PandemGuild/Pandem-Mono...");
  const { data } = await o.pulls.list({
    owner: "PandemGuild",
    repo: "Pandem-Mono",
    state: "all"
  });
  
  if (data.length === 0) {
    console.log("No PRs found. I will create a simulated Success PR for the test.");
  } else {
    data.forEach(p => console.log(`PR #${p.number}: ${p.title} (${p.state})`));
  }
}

main().catch(console.error);
