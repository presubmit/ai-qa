// import { test } from "aiqa";

const aiqa = new aiQA();

aiqa("Authenticate with credentials", {
    username: "test",
    password: "test",
}).

aiqa.test("Verify that you're redirected to the dashboard");

aiqa.test("Verify that you can create a new project", {
    name: "Test Project",
});

aiqa.run();