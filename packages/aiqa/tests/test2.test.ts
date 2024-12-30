import { test, beforeAll, beforeEach, afterEach, afterAll } from "../src/index";

beforeAll(() => {
  console.log("Setting up tests in test2.test.ts...");
});

beforeEach(() => {
  console.log("Running before each test...");
});

afterEach(() => {
  console.log("Running after each test...");
});

afterAll(() => {
  console.log("Running after all tests...");
});

test('Verify that users can navigate to "Projects" tab');

test('Verify that users can navigate to "People" tab');