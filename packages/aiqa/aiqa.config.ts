import { AiQaConfig } from "./src/core/types";

const config: AiQaConfig = {
    anthropicKey: process.env.ANTHROPIC_API_KEY!,
    baseUrl: "https://github.com/orgs/presubmit/repositories",
    testDirectory: "tests",
};

export default config;