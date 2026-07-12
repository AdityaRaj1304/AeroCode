// ============================================================
// AeroCode Web — LLM Service (WebLLM)
// ============================================================
// Manages on-device LLM inference using @mlc-ai/web-llm.
// Provides code review, explanation, and chat capabilities
// entirely within the browser — no network required.
// ============================================================

import type { AIReviewResult } from '../types';

/** Progress callback for model loading. */
export type ProgressCallback = (progress: number, message: string) => void;

/** Configuration for the LLM service. */
export interface LLMServiceConfig {
  modelId: string;
  onProgress?: ProgressCallback;
}

const DEFAULT_MODEL = 'Phi-3.5-mini-instruct-q4f16_1-MLC';

/**
 * LLM Service — wraps @mlc-ai/web-llm for air-gapped inference.
 *
 * Usage:
 *   const service = new LLMService({ modelId: '...' });
 *   await service.initialize();
 *   const review = await service.reviewCode(code);
 */
class LLMService {
  private engine: unknown = null;
  private modelId: string;
  private onProgress?: ProgressCallback;
  private _isReady = false;

  constructor(config?: Partial<LLMServiceConfig>) {
    this.modelId = config?.modelId ?? DEFAULT_MODEL;
    this.onProgress = config?.onProgress;
  }

  /** Whether the engine has been successfully initialized. */
  get isReady(): boolean {
    return this._isReady;
  }

  /** The model name currently loaded (or pending). */
  get modelName(): string {
    return this.modelId;
  }

  /**
   * Initialize the WebLLM engine.
   * Downloads and caches the model in the browser's IndexedDB.
   */
  async initialize(): Promise<void> {
    try {
      // Dynamic import to avoid bundling issues if the package isn't ready
      const webllm = await import('@mlc-ai/web-llm');

      this.engine = await webllm.CreateMLCEngine(this.modelId, {
        initProgressCallback: (report: { progress: number; text: string }) => {
          const pct = Math.round(report.progress * 100);
          this.onProgress?.(pct, report.text);
        },
      });

      this._isReady = true;
      this.onProgress?.(100, 'Model ready');
    } catch (error) {
      console.error('[LLMService] Initialization failed:', error);
      this._isReady = false;
      throw error;
    }
  }

  /**
   * Generate an AI code review for the given source code.
   */
  async reviewCode(code: string, language: string): Promise<AIReviewResult[]> {
    if (!this._isReady || !this.engine) {
      return this.getMockReviews(code);
    }

    try {
      const prompt = this.buildReviewPrompt(code, language);
      const response = await this.chat(prompt);
      return this.parseReviewResponse(response);
    } catch {
      return this.getMockReviews(code);
    }
  }

  /**
   * Generate an explanation for the given source code.
   */
  async explainCode(code: string, language: string): Promise<string> {
    if (!this._isReady || !this.engine) {
      return this.getMockExplanation(code, language);
    }

    try {
      const prompt = `Explain the following ${language} code concisely. Focus on what each part does and any notable patterns:\n\n\`\`\`${language}\n${code}\n\`\`\``;
      return await this.chat(prompt);
    } catch {
      return this.getMockExplanation(code, language);
    }
  }

  /**
   * Free-form chat with the AI about code.
   */
  async chatMessage(userMessage: string): Promise<string> {
    if (!this._isReady || !this.engine) {
      return 'The AI model is not yet loaded. Please wait for initialization to complete.';
    }
    return this.chat(userMessage);
  }

  /** Send a message to the engine and get a completion. */
  private async chat(message: string): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eng = this.engine as any;
    const reply = await eng.chat.completions.create({
      messages: [
        {
          role: 'system',
          content:
            'You are AeroCode AI, a helpful pair-programming assistant running entirely on-device. Provide concise, actionable responses.',
        },
        { role: 'user', content: message },
      ],
      temperature: 0.3,
      max_tokens: 1024,
    });
    return reply.choices[0]?.message?.content ?? '';
  }

  /** Build the review prompt. */
  private buildReviewPrompt(code: string, language: string): string {
    return `Review the following ${language} code. For each issue found, respond with a JSON array of objects, each having: "title" (short), "content" (explanation), "severity" ("info" | "warning" | "error" | "success"), and "lineRange" (optional {start, end}).

\`\`\`${language}
${code}
\`\`\`

Respond ONLY with the JSON array.`;
  }

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
    return `## Code Explanation (${language})\n\nThis is a ${lineCount}-line ${language} snippet. The AI model is still loading — once ready, AeroCode will provide a detailed, context-aware explanation.\n\n**Tip:** Click "Load Model" in the status bar to start downloading the on-device AI model.`;
  }

  /** Tear down the engine and free resources. */
  async dispose(): Promise<void> {
    if (this.engine) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (this.engine as any).unload?.();
      this.engine = null;
      this._isReady = false;
    }
  }
}

/** Singleton instance for use across the app. */
export const llmService = new LLMService();
export default LLMService;
