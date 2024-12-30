import { TestCase, Hook, TestSuite } from "./types";

class TestRegistry {
    private tests: TestCase[] = [];
    private beforeAllHooks: Hook[] = [];
    private beforeEachHooks: Hook[] = [];
    private afterEachHooks: Hook[] = [];
    private afterAllHooks: Hook[] = [];

    addTest(instructions: string): void {
        this.tests.push({ instructions });
    }

    addBeforeAll(hook: Hook): void {
        this.beforeAllHooks.push(hook);
    }

    addBeforeEach(hook: Hook): void {
        this.beforeEachHooks.push(hook);
    }

    addAfterEach(hook: Hook): void {
        this.afterEachHooks.push(hook);
    }

    addAfterAll(hook: Hook): void {
        this.afterAllHooks.push(hook);
    }

    getTestSuite(): TestSuite {
        return {
            tests: this.tests,
            beforeAllHooks: this.beforeAllHooks,
            beforeEachHooks: this.beforeEachHooks,
            afterEachHooks: this.afterEachHooks,
            afterAllHooks: this.afterAllHooks,
        };
    }

    clear(): void {
        this.tests = [];
        this.beforeAllHooks = [];
        this.beforeEachHooks = [];
        this.afterEachHooks = [];
        this.afterAllHooks = [];
    }
}

// Singleton instance of a test file registry
export default new TestRegistry();
