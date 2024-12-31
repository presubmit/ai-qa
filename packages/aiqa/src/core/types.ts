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