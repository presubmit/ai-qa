
import {TestFile } from "../core/types";
import runTests from "../core/testManager";
import { config, loadConfig } from "../util/config"; 
import pc from "picocolors";
import { loadTestFiles } from "../util/files";

async function runTestsParallel(files: TestFile[]) {
    const concurrency = config().maxConcurrency || 4;
    console.log(`Running tests in parallel with max concurrency: ${concurrency}`);

    const queue = [...files];
    const running: Promise<void>[] = [];

    const workerHandler = async (testFile: TestFile) => {
        await runTests(testFile);
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

async function runTestFiles() {
    const testFiles = await loadTestFiles();
    if (testFiles.length === 0) {
        console.log("No test files found.");
        return;
    }
    console.log(`Found ${testFiles.length} test files.`);

    if (config().parallel) {
        await runTestsParallel(testFiles);
    } else {
        console.log("Running tests sequentially...");
        for (const file of testFiles) {
            console.log(`Running test file: ${file.path}`);
            await runTests(file);
        }
    }
}

async function main() {
    try {
        await loadConfig();
    } catch (err) {
        if (err instanceof Error) {
            console.log(pc.red("Error loading config: " + err.message));
            process.exit(1);
        } else {
            throw err;
        }
    }

    try {
        await runTestFiles();
    } catch (err) {
        if (err instanceof Error) {
            console.log(pc.red("Error running tests: " + err.message));
            process.exit(1);
        } else {
            throw err;
        }
    }
}
main();

