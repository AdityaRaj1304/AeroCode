// ============================================================
// AeroCode Web — LLM Web Worker (Placeholder)
// ============================================================
// This worker will offload LLM inference off the main thread
// to keep the UI responsive during generation.
//
// Currently a placeholder — WebLLM's CreateMLCEngine already
// uses WebGPU which runs on the GPU thread. This worker will
// be useful for CPU-fallback models or pre/post-processing.
// ============================================================

/// <reference lib="webworker" />

export type WorkerMessageType =
  | 'init'
  | 'generate'
  | 'progress'
  | 'result'
  | 'error';

export interface WorkerMessage {
  type: WorkerMessageType;
  payload: unknown;
}

self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'init':
      handleInit(payload as { modelId: string });
      break;
    case 'generate':
      handleGenerate(payload as { prompt: string });
      break;
    default:
      postMessage({
        type: 'error',
        payload: `Unknown message type: ${type}`,
      });
  }
};

async function handleInit(_config: { modelId: string }) {
  // Future: Initialize the engine inside the worker
  postMessage({
    type: 'progress',
    payload: { progress: 100, message: 'Worker ready (placeholder)' },
  });
}

async function handleGenerate(_request: { prompt: string }) {
  // Future: Run inference inside the worker
  postMessage({
    type: 'result',
    payload: {
      text: 'Worker inference not yet implemented. Using main-thread engine.',
    },
  });
}

export {};
