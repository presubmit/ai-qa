import { glob } from "fast-glob";
import { existsSync } from "fs";
import minimist from "minimist";
import { join } from "path";

export interface ExternalConfig {
    anthropicApiKey: string;
    baseUrl: string;
    headless?: boolean;

    // If both are provided, testPattern is used
    testPattern?: string;
    testDir?: string;

    // Timeout for each test (milliseconds)
    timeout?: number;

    // Parallelism
    parallel?: boolean;    // Whether to run tests in parallel
    maxConcurrency?: number;  // Maximum concurrency for parallel execution

    // Debugging
    debug?: boolean;
}

export interface Config extends ExternalConfig {
    screenWidth: number;
    screenHeight: number;
    screenshotsDir: string;
    anthropicModel: string;
};

const DEFAULT_CONFIG: Config = {
    anthropicApiKey: "",
    baseUrl: "",
    headless: false,
    testPattern: undefined,
    testDir: undefined,
    timeout: undefined,
    parallel: false,
    maxConcurrency: 4,
    debug: false,

    // internal
    screenWidth: 1280,
    screenHeight: 800,
    screenshotsDir: ".aiqa/screenshots",
    anthropicModel: "claude-3-5-sonnet-20241022",
};

const args = minimist(process.argv.slice(2));

class ConfigManager {
    private static instance: ConfigManager;
    private config: Config = DEFAULT_CONFIG;
    private initialized = false;

    static getInstance(): ConfigManager {
        if (!ConfigManager.instance) {
            ConfigManager.instance = new ConfigManager();
        }
        return ConfigManager.instance;
    }

    public async loadConfig(): Promise<void> {
        let config: Config = DEFAULT_CONFIG;
        try {
            const loadedConfig = (await import(join(process.cwd(), "aiqa.config.ts"))).default as Config;
            console.log("Found aiqa.config.ts:", loadedConfig);
            config = { ...DEFAULT_CONFIG, ...loadedConfig } as Config;
        } catch (err) {
            console.log("Could not find aiqa.config.ts.");
        }

        // Maybe override config with args
        if (args.anthropicApiKey) {
            config.anthropicApiKey = args.anthropicApiKey;
        }
        if (args.baseUrl) {
            config.baseUrl = args.baseUrl;
        }
        if (args.testDir && !args.testPattern) {
            config.testDir = args.testDir;
            config.testPattern = undefined;
        }
        if (args.testPattern) {
            config.testPattern = args.testPattern;
            config.testDir = undefined;
        }
        if (args.timeout) {
            config.timeout = args.timeout;
        }
        if (args.parallel) {
            config.parallel = args.parallel;
        }
        if (args.maxConcurrency) {
            config.maxConcurrency = args.maxConcurrency;
        }
        if (args.debug) {
            config.debug = true;
        }

        if (config.debug) {
            console.log("Configuration:", config);
        }

        await this.validateConfig(config);

        this.config = config;
        this.initialized = true;
    }

    private async validateConfig(config: Config): Promise<void> {
        if (!config.testPattern && !config.testDir) {
            throw new Error("Either testPattern or testDir must be provided.");
        }
        if (config.testDir && config.testPattern) {
            throw new Error("Only one of testPattern or testDir must be provided.");
        }
        if (config.anthropicApiKey === "") {
            throw new Error("Anthropic API key is required. Please set it in aiqa.config.ts or pass it as an argument (--anthropicApiKey).");
        }
        if (config.baseUrl === "") {
            throw new Error("Base URL is required. Please set it in aiqa.config.ts or pass it as an argument (--baseUrl).");
        }
        if (config.testDir && !existsSync(config.testDir)) {
            throw new Error(`Test directory ${config.testDir} does not exist.`);
        }
    }

    getConfig(): Config {
        if (!this.initialized) {
            throw new Error('Config not loaded. Call loadConfig() first.');
        }
        return this.config;
    }
}

export const config = () => ConfigManager.getInstance().getConfig();
export const loadConfig = () => ConfigManager.getInstance().loadConfig();