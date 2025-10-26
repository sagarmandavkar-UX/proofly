export interface RafScheduler {
  schedule(): void;
  cancel(): void;
}

export function createRafScheduler(callback: () => void): RafScheduler {
  let frameId: number | null = null;

  const run = () => {
    frameId = null;
    callback();
  };

  return {
    schedule() {
      if (frameId !== null) {
        return;
      }
      frameId = requestAnimationFrame(run);
    },
    cancel() {
      if (frameId === null) {
        return;
      }
      cancelAnimationFrame(frameId);
      frameId = null;
    },
  };
}
