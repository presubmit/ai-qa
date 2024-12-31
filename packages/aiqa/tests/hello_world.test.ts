import { test, beforeAll, beforeEach } from "../src/index";

beforeAll(() => {
  console.log("Setting up tests...");
});

beforeEach(() => {
  console.log("Running before each test...");
});

test('Verify that user can navigate to "ai-qa" repository');
