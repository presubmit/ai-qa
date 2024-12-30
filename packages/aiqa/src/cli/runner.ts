import fs from "fs/promises";
import { join, extname } from "path";
import minimist from "minimist";
import registry from "../core/testRegistry";
import { AiQaConfig as Config, TestFile } from "../core/types";
import runTests from "../core/testManager";

const args = minimist(process.argv.slice(2));

async function loadConfig(): Promise<Config> {
    try {
        const config = (await import(join(process.cwd(), "aiqa.config.ts"))).default as Config;
        console.log("Loaded configuration:", config);

        // Apply `--grep` argument to override config if provided
        if (args.grep) {
            console.log("Applying grep argument:", args.grep);
            config.grep = args.grep;
        }

        return config;
    } catch (err) {
        throw new Error("Could not load aiqa.config.ts. Ensure the file exists and is properly formatted.");
    }
}

async function findTestFiles(dir: string): Promise<TestFile[]> {
    const files = await fs.readdir(dir, { withFileTypes: true });
    const testFiles: TestFile[] = [];

    for (const file of files) {
        const fullPath = join(dir, file.name);

        if (file.isDirectory()) {
            testFiles.push(...(await findTestFiles(fullPath))); // Recursively add test files
        } else if (extname(file.name) === ".ts" && file.name.endsWith(".test.ts")) {
            console.log(`Importing test file: ${file}`);

            registry.clear();
            await import(join(process.cwd(), fullPath)); // Load test file
            testFiles.push({
                path: fullPath,
                ...registry.getTestSuite(),
            });
        }
    }

    return testFiles;
}

async function runTestsParallel(files: TestFile[], config: Config) {
    const concurrency = config.concurrency || 4;
    console.log(`Running tests in parallel with max concurrency: ${config.concurrency}`);

    const queue = [...files];
    const running: Promise<void>[] = [];

    const workerHandler = async (testFile: TestFile) => {
        await runTests(testFile, config);
    };

    while (queue.length > 0 || running.length > 0) {
        while (running.length < concurrency && queue.length > 0) {
            const file = queue.shift()!;
            const workerPromise = workerHandler(file).finally(() => {
                const index = running.indexOf(workerPromise);
                if (index > -1) running.splice(index, 1);
            });
            running.push(workerPromise);
        }

        // Wait for one worker to complete
        await Promise.race(running);
    }
}

async function runTestFiles(config: Config) {
    const testFiles = await findTestFiles(config.testDirectory);
    if (testFiles.length === 0) {
        console.log("No test files found.");
        return;
    }
    console.log(`Found ${testFiles.length} test files.`);

    if (config.parallel) {
        await runTestsParallel(testFiles, config);
    } else {
        console.log("Running tests sequentially...");
        for (const file of testFiles) {
            console.log(`Running test file: ${file.path}`);
            await runTests(file, config); // Run tests
        }
    }
}

async function main() {
    try {
        const config = await loadConfig();

        await runTestFiles(config);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}
main();

