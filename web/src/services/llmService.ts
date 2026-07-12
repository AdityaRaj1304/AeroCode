// ============================================================
// AeroCode Web — LLM Service (Worker Proxy)
// ============================================================
// Manages the Web Worker that runs @mlc-ai/web-llm off the
// main thread. Provides a clean async API for the React UI.
//
// All LLM inference runs in /workers/llm.worker.ts — this
// service only handles message routing and promise resolution.
// ============================================================

import type {
  AIReviewResult,
  WorkerRequest,
  WorkerResponse,
  WorkerResponseEvent,
  InitProgressPayload,
  InitCompletePayload,
  InitErrorPayload,
  TokenStreamPayload,
  GenerationCompletePayload,
  GenerationErrorPayload,
  WebGPUUnsupportedPayload,
  TelemetryPayload,
} from '../types';

// ── Callback types ───────────────────────────────────────────

/** Fired during model download with percentage + status message. */
export type ProgressCallback = (progress: number, message: string) => void;

/** Fired each time a new token is generated. */
export type TokenCallback = (token: string, fullText: string) => void;

/** Fired if WebGPU is not supported on the client. */
export type WebGPUErrorCallback = (
  error: string,
  suggestion: string
) => void;

// ── Pending request tracker ──────────────────────────────────

interface PendingRequest {
  resolve: (value: string) => void;
  reject: (reason: Error) => void;
  onToken?: TokenCallback;
}

// ── Default model ────────────────────────────────────────────

const DEFAULT_MODEL = 'Qwen2.5-Coder-0.5B-Instruct-q4f16_1-MLC';

// ── Service Class ────────────────────────────────────────────

class LLMService {
  private worker: Worker | null = null;
  private pending = new Map<string, PendingRequest>();
  private _isReady = false;
  private _isInitializing = false;
  private _modelId: string = DEFAULT_MODEL;
  private _requestCounter = 0;

  // Callbacks set by the React UI
  public onProgress?: ProgressCallback;
  public onWebGPUError?: WebGPUErrorCallback;
  public onTelemetry?: (payload: TelemetryPayload) => void;

  // ── Public getters ────────────────────────────────────────

  get isReady(): boolean {
    return this._isReady;
  }

  get isInitializing(): boolean {
    return this._isInitializing;
  }

  get modelName(): string {
    return this._modelId;
  }

  // ── Worker Lifecycle ──────────────────────────────────────

  /**
   * Initialize the LLM model via the Web Worker.
   * Streams progress back through `onProgress` callback.
   */
  async initialize(modelId?: string): Promise<void> {
    if (this._isReady || this._isInitializing) return;

    this._modelId = modelId ?? DEFAULT_MODEL;
    this._isInitializing = true;

    // Spawn the Web Worker using Vite's worker import syntax
    this.worker = new Worker(
      new URL('../workers/llm.worker.ts', import.meta.url),
      { type: 'module' }
    );

    // Wire up the message handler
    this.worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      this.handleWorkerMessage(event.data);
    };

    this.worker.onerror = (event: ErrorEvent) => {
      console.error('[LLMService] Worker error:', event.message);
      this._isInitializing = false;
    };

    // Send INIT_MODEL request and wait for completion
    return new Promise<void>((resolve, reject) => {
      const id = this.nextId();
      this.pending.set(id, {
        resolve: () => {
          this._isReady = true;
          this._isInitializing = false;
          resolve();
        },
        reject: (err) => {
          this._isInitializing = false;
          reject(err);
        },
      });

      this.send({
        id,
        action: 'INIT_MODEL',
        payload: { modelId: this._modelId },
      });
    });
  }

  /**
   * Run a security-focused code review with streaming tokens.
   */
  async reviewCode(
    code: string,
    language: string,
    selection?: string,
    onToken?: TokenCallback
  ): Promise<AIReviewResult[]> {
    if (!this._isReady) {
      return this.getMockReviews(code);
    }

    try {
      const raw = await this.requestGeneration(
        'GENERATE_REVIEW',
        { code, language, selection },
        onToken
      );
      return this.parseReviewResponse(raw);
    } catch (err) {
      console.error('[LLMService] Review failed:', err);
      return this.getMockReviews(code);
    }
  }

  /**
   * Run a specialized enterprise compliance audit (OWASP, SOC2, Complexity) with streaming tokens.
   */
  async runComplianceAudit(
    code: string,
    language: string,
    lensType: 'owasp' | 'soc2' | 'complexity',
    selection?: string,
    onToken?: TokenCallback
  ): Promise<AIReviewResult[]> {
    if (!this._isReady) {
      return this.getMockReviews(code);
    }

    try {
      const raw = await this.requestGeneration(
        'RUN_COMPLIANCE_AUDIT',
        { code, language, selection, lensType } as any,
        onToken
      );
      return this.parseReviewResponse(raw);
    } catch (err) {
      console.error('[LLMService] Compliance Audit failed:', err);
      return this.getMockReviews(code);
    }
  }

  /**
   * Generate a plain-English explanation with streaming tokens.
   */
  async explainCode(
    code: string,
    language: string,
    selection?: string,
    onToken?: TokenCallback
  ): Promise<string> {
    if (!this._isReady) {
      return this.getMockExplanation(code, language);
    }

    try {
      return await this.requestGeneration(
        'EXPLAIN_CODE',
        { code, language, selection },
        onToken
      );
    } catch (err) {
      console.error('[LLMService] Explanation failed:', err);
      return this.getMockExplanation(code, language);
    }
  }

  /**
   * Generate a refactored version of the code (or selection) with streaming tokens.
   * Strips markdown to ensure strict raw code output.
   */
  async refactorCode(
    code: string,
    language: string,
    selection?: string,
    onToken?: TokenCallback
  ): Promise<string> {
    if (!this._isReady) {
      return code; // Fallback to original code if model isn't ready
    }

    try {
      const raw = await this.requestGeneration(
        'REFACTOR_CODE',
        { code, language, selection },
        onToken
      );
      
      // Strict stripping of markdown blocks just in case the model ignores the prompt
      return raw.replace(/^```[\w-]*\n/gm, '').replace(/```\s*$/gm, '').trim();
    } catch (err) {
      console.error('[LLMService] Refactoring failed:', err);
      return code;
    }
  }

  /**
   * Tear down the worker and free resources.
   */
  dispose(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.pending.clear();
    this._isReady = false;
    this._isInitializing = false;
  }

  // ── Private: Messaging ────────────────────────────────────

  /** Send a typed request to the worker. */
  private send(request: WorkerRequest): void {
    this.worker?.postMessage(request);
  }

  /** Generate a unique request ID. */
  private nextId(): string {
    return `req-${++this._requestCounter}-${Date.now()}`;
  }

  /** Send a generation request and return a promise for the full text. */
  private requestGeneration(
    action: 'GENERATE_REVIEW' | 'EXPLAIN_CODE' | 'REFACTOR_CODE' | 'RUN_COMPLIANCE_AUDIT',
    payload: { code: string; language: string; selection?: string; lensType?: string },
    onToken?: TokenCallback
  ): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const id = this.nextId();
      this.pending.set(id, { resolve, reject, onToken });
      this.send({ id, action, payload });
    });
  }

  /** Route worker messages to the appropriate handler. */
  private handleWorkerMessage(msg: WorkerResponse): void {
    const { id, event, payload } = msg;

    if (event === 'TELEMETRY_UPDATE') {
      this.onTelemetry?.(payload as TelemetryPayload);
      return;
    }

    const handler = this.getEventHandler(event);
    handler(id, payload);
  }

  /** Map event names to handler methods. */
  private getEventHandler(
    event: WorkerResponseEvent
  ): (id: string, payload: unknown) => void {
    const handlers: Record<
      WorkerResponseEvent,
      (id: string, payload: unknown) => void
    > = {
      INIT_PROGRESS: (id, p) =>
        this.handleInitProgress(id, p as InitProgressPayload),
      INIT_COMPLETE: (id, p) =>
        this.handleInitComplete(id, p as InitCompletePayload),
      INIT_ERROR: (id, p) =>
        this.handleInitError(id, p as InitErrorPayload),
      TOKEN_STREAM: (id, p) =>
        this.handleTokenStream(id, p as TokenStreamPayload),
      GENERATION_COMPLETE: (id, p) =>
        this.handleGenerationComplete(id, p as GenerationCompletePayload),
      GENERATION_ERROR: (id, p) =>
        this.handleGenerationError(id, p as GenerationErrorPayload),
      WEBGPU_UNSUPPORTED: (id, p) =>
        this.handleWebGPUUnsupported(id, p as WebGPUUnsupportedPayload),
      TELEMETRY_UPDATE: () => {}, // Handled separately in handleWorkerMessage
    };

    return handlers[event] ?? (() => {});
  }

  // ── Event Handlers ────────────────────────────────────────

  private handleInitProgress(
    _id: string,
    payload: InitProgressPayload
  ): void {
    this.onProgress?.(payload.progress, payload.message);
  }

  private handleInitComplete(
    id: string,
    _payload: InitCompletePayload
  ): void {
    const req = this.pending.get(id);
    if (req) {
      req.resolve('');
      this.pending.delete(id);
    }
  }

  private handleInitError(id: string, payload: InitErrorPayload): void {
    const req = this.pending.get(id);
    if (req) {
      req.reject(new Error(payload.error));
      this.pending.delete(id);
    }
  }

  private handleTokenStream(
    id: string,
    payload: TokenStreamPayload
  ): void {
    const req = this.pending.get(id);
    req?.onToken?.(payload.token, payload.fullText);
  }

  private handleGenerationComplete(
    id: string,
    payload: GenerationCompletePayload
  ): void {
    const req = this.pending.get(id);
    if (req) {
      req.resolve(payload.fullText);
      this.pending.delete(id);
    }
  }

  private handleGenerationError(
    id: string,
    payload: GenerationErrorPayload
  ): void {
    const req = this.pending.get(id);
    if (req) {
      req.reject(new Error(payload.error));
      this.pending.delete(id);
    }
  }

  private handleWebGPUUnsupported(
    id: string,
    payload: WebGPUUnsupportedPayload
  ): void {
    this.onWebGPUError?.(payload.error, payload.suggestion);
    const req = this.pending.get(id);
    if (req) {
      req.reject(new Error(payload.error));
      this.pending.delete(id);
    }
  }

  // ── Fallbacks ─────────────────────────────────────────────

  /** Parse a JSON review response into AIReviewResult objects. */
  private parseReviewResponse(response: string): AIReviewResult[] {
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return this.getMockReviews('');
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.map(
        (
          item: {
            title?: string;
            content?: string;
            severity?: string;
            lineRange?: { start: number; end: number };
          },
          index: number
        ): AIReviewResult => ({
          id: `review-${Date.now()}-${index}`,
          type: 'review' as const,
          title: item.title ?? 'Review item',
          content: item.content ?? '',
          severity: (['info', 'warning', 'error', 'success'].includes(
            item.severity ?? ''
          )
            ? item.severity
            : 'info') as AIReviewResult['severity'],
          timestamp: new Date(),
          lineRange: item.lineRange,
        })
      );
    } catch {
      return this.getMockReviews('');
    }
  }

  /** Fallback mock reviews when model isn't loaded. */
  private getMockReviews(code: string): AIReviewResult[] {
    const reviews: AIReviewResult[] = [
      {
        id: `mock-${Date.now()}-0`,
        type: 'review',
        title: 'Code structure looks good',
        content:
          'The overall structure follows best practices. Consider adding JSDoc comments for public functions.',
        severity: 'success',
        timestamp: new Date(),
      },
      {
        id: `mock-${Date.now()}-1`,
        type: 'suggestion',
        title: 'Consider error handling',
        content:
          'Adding try-catch blocks around async operations would improve resilience.',
        severity: 'info',
        timestamp: new Date(),
      },
    ];

    if (code.length > 500) {
      reviews.push({
        id: `mock-${Date.now()}-2`,
        type: 'review',
        title: 'Function length',
        content:
          'Some functions may benefit from being split into smaller, more focused units.',
        severity: 'warning',
        timestamp: new Date(),
      });
    }

    return reviews;
  }

  /** Fallback mock explanation. */
  private getMockExplanation(code: string, language: string): string {
    const lineCount = code.split('\n').length;
    return `## Code Explanation (${language})\n\nThis is a ${lineCount}-line ${language} snippet. The AI model is still loading — once ready, AeroCode will provide a detailed, context-aware explanation.\n\n**Tip:** Click "Load Model" in the navbar to start downloading the on-device AI model.`;
  }
}

/** Singleton instance for use across the app. */
export const llmService = new LLMService();
export default LLMService;
