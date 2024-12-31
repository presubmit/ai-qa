import { QaAgent } from "../qa/agent";
import { TestFile } from "./types";
import pc from "picocolors";

class TestManager {
  private testFile: TestFile;

  constructor(testFile: TestFile) {
    this.testFile = testFile;
  }

  async runTests(): Promise<void> {
    console.log(pc.blue(`Running ${this.testFile.tests.length} tests from ${this.testFile.path}...`));

    // Run beforeAll hooks
    for (const hook of this.testFile.beforeAllHooks) {
      await hook();
    }

    const agent = new QaAgent();

    for (const { instructions } of this.testFile.tests) {
      console.log(`Starting: ${instructions}`);
      try {
        // Run beforeEach hooks
        for (const hook of this.testFile.beforeEachHooks) {
          await hook();
        }

        // Run the test
        await agent.runTest(instructions);

        // Run afterEach hooks
        for (const hook of this.testFile.afterEachHooks) {
          await hook();
        }

        console.log(`✅ ${instructions}`);
      } catch (error) {
        console.error(`❌ ${instructions}`);
        console.error(error);
      }
    }

    // Run afterAll hooks
    for (const hook of this.testFile.afterAllHooks) {
      await hook();
    }
  }
}

async function runTests(testFile: TestFile): Promise<void> {
  return await new TestManager(testFile).runTests();
}

export default runTests;