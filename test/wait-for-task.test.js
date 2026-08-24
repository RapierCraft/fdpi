import assert from "node:assert/strict";
import test from "node:test";

import { waitForTask } from "../src/wait-for-task.js";

function sequence(...responses) {
  let reads = 0;
  return {
    readTask: async () => {
      const response = responses[reads];
      reads += 1;
      if (!response) throw new Error("Test exhausted its response sequence");
      return response;
    },
    reads: () => reads,
  };
}

test("returns the value for legacy done status", async () => {
  const source = sequence({ status: "done", value: "ready" });
  assert.equal(await waitForTask(source.readTask, { pause: async () => {} }), "ready");
  assert.equal(source.reads(), 1);
});

test("continues through waiting and working states", async () => {
  const source = sequence(
    { status: "waiting" },
    { status: "working" },
    { status: "done", value: "complete" },
  );
  assert.equal(await waitForTask(source.readTask, { pause: async () => {} }), "complete");
  assert.equal(source.reads(), 3);
});

test("throws when the task fails", async () => {
  const source = sequence({ status: "failed", error: "worker crashed" });
  await assert.rejects(
    waitForTask(source.readTask, { pause: async () => {} }),
    /Task failed: worker crashed/,
  );
});

test("fails closed for unknown statuses", async () => {
  const source = sequence({ status: "mystery" });
  await assert.rejects(
    waitForTask(source.readTask, { pause: async () => {} }),
    /Unknown task status: mystery/,
  );
});
