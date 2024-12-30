export interface AiQaConfig {
    anthropicKey: string;
    baseUrl: string;
    testDirectory: string; // Directory containing test files
    parallel?: boolean;    // Whether to run tests in parallel
    concurrency?: number;  // Maximum concurrency for parallel execution
    grep?: string;         // Regex string to filter test names
    timeout?: number;      // Global timeout for tests (milliseconds)
}

export interface TestCase {
  instructions: string;
}

export type Hook = () => void | Promise<void>;

export interface TestSuite {
  tests: TestCase[];
  beforeAllHooks: Hook[];
  beforeEachHooks: Hook[];
  afterEachHooks: Hook[];
  afterAllHooks: Hook[];
}

export interface TestFile extends TestSuite {
  path: string;
}