import { AiQaConfig } from "./src/index";

const config: AiQaConfig = {
    anthropicApiKey: process.env.ANTHROPIC_API_KEY!,
    baseUrl: "https://github.com/orgs/presubmit/repositories",
    testDir: "tests",
};

export default config;