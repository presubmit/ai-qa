import fs from "fs/promises";
import { join, extname } from "path";
import registry from "../core/testRegistry";
import {TestFile } from "../core/types";
import { glob } from "fast-glob";
import { config } from "./config";

export async function loadTestFiles(): Promise<TestFile[]> {
    const {testDir, testPattern, debug} = config();
    let testFilePaths: string[] = [];
    if (testPattern) {
        testFilePaths = await findTestsByPattern(testPattern);
        if (testFilePaths.length === 0) {
            throw new Error(`No test files found with pattern: ${testPattern}`);
        }
    } else if (testDir) {
        testFilePaths = await findTestsInDir(testDir);
        if (testFilePaths.length === 0) {
            throw new Error(`No test files found in directory: ${testDir}`);
        }
    }

    if (testFilePaths.length === 0) {
        throw new Error("No test files found.");
    }

    let testFiles: TestFile[] = [];
    for (const testFilePath of testFilePaths) {
        registry.clear();
        // Import using absolute path
        await import(join(process.cwd(), testFilePath));

        const testSuite = registry.getTestSuite();
        testFiles.push({
            path: testFilePath,
            ...testSuite,
        });

        if (debug) {
            console.log(`Imported ${testSuite.tests.length} tests from: ${testFilePath}`);
        }
    }

    return testFiles;
}

async function findTestsByPattern(pattern: string): Promise<string[]> {
    return await glob(pattern, { absolute: false });
}

async function findTestsInDir(dir: string): Promise<string[]> {
    const files = await fs.readdir(dir, { withFileTypes: true });
    const testFiles: string[] = [];

    for (const file of files) {
        const fullPath = join(dir, file.name);

        if (file.isDirectory()) {
            testFiles.push(...(await findTestsInDir(fullPath)));
        } else if (extname(file.name) === ".ts" && file.name.endsWith(".test.ts")) {
            testFiles.push(fullPath);
        }
    }

    return testFiles;
}