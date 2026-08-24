export async function waitForTask(readTask, options = {}) {
  const pause = options.pause ?? (() => new Promise((resolve) => setTimeout(resolve, 10)));

  while (true) {
    const task = await readTask();

    switch (task.status) {
      case "waiting":
      case "working":
        await pause();
        break;
      case "done":
      case "succeeded":
        return task.value;
      case "failed":
        throw new Error(`Task failed: ${task.error ?? "unknown failure"}`);
      default:
        throw new Error(`Unknown task status: ${String(task.status)}`);
    }
  }
}
