import registry from "./testRegistry";
import type { Hook } from "./types";

// Helper function to wrap tests for chaining
function test(instructions: string): typeof test {
  registry.addTest(instructions);
  return test;
}

// Hook registrations
function beforeAll(hook: Hook): void {
  registry.addBeforeAll(hook);
}

function beforeEach(hook: Hook): void {
  registry.addBeforeEach(hook);
}

function afterEach(hook: Hook): void {
  registry.addAfterEach(hook);
}

function afterAll(hook: Hook): void {
  registry.addAfterAll(hook);
}

export { test, beforeAll, beforeEach, afterEach, afterAll };