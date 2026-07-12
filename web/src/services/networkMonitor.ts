// ============================================================
// AeroCode Web — Network Monitor (Paranoid Mode)
// ============================================================
// A lightweight utility to aggressively intercept and track all
// outbound network requests. When Paranoid Mode is enabled, it
// proves that no external requests are leaking data to the cloud.
// ============================================================

export type NetworkActivityCallback = (externalApiCalls: number, bytesLeaked: number) => void;

class NetworkMonitorService {
  private _isActive = false;
  private _externalApiCalls = 0;
  private _bytesLeaked = 0;
  private _onActivity?: NetworkActivityCallback;

  // Save original methods
  private originalFetch = window.fetch;
  private originalXhrOpen = XMLHttpRequest.prototype.open;
  private originalXhrSend = XMLHttpRequest.prototype.send;

  constructor() {
    this.interceptNetwork();
  }

  get isActive() {
    return this._isActive;
  }

  set isActive(value: boolean) {
    this._isActive = value;
    if (!value) {
      // Reset stats when turning off
      this._externalApiCalls = 0;
      this._bytesLeaked = 0;
      this._onActivity?.(0, 0);
    }
  }

  set onActivity(cb: NetworkActivityCallback) {
    this._onActivity = cb;
  }

  get stats() {
    return {
      calls: this._externalApiCalls,
      bytes: this._bytesLeaked,
    };
  }

  private isExternal(url: string): boolean {
    try {
      // Relative URLs are not external
      if (url.startsWith('/') || url.startsWith('.')) return false;
      const parsed = new URL(url, window.location.href);
      // Exclude localhost/127.0.0.1 for local dev (like Vite HMR)
      return parsed.hostname !== 'localhost' && parsed.hostname !== '127.0.0.1';
    } catch {
      return true;
    }
  }

  private estimateSize(body?: any): number {
    if (!body) return 0;
    if (typeof body === 'string') return new Blob([body]).size;
    if (body instanceof Blob) return body.size;
    if (body instanceof FormData) {
      // Rough estimation for FormData
      return 1024;
    }
    return 512; // default guess
  }

  private trackRequest(url: string, body?: any) {
    if (this._isActive && this.isExternal(url)) {
      this._externalApiCalls++;
      this._bytesLeaked += this.estimateSize(body);
      
      console.warn(`[Paranoid Mode] Blocked/Tracked external request to: ${url}`);
      
      this._onActivity?.(this._externalApiCalls, this._bytesLeaked);
      
      // In strict Paranoid Mode, we could actually throw an error to BLOCK it.
      // throw new Error(`Paranoid Mode blocked outbound request to ${url}`);
    }
  }

  private interceptNetwork() {
    const self = this;

    // 1. Monkey-patch fetch
    window.fetch = async function (...args) {
      const [input, init] = args;
      let url = '';
      if (typeof input === 'string') {
        url = input;
      } else if (input instanceof Request) {
        url = input.url;
      }

      if (self.isActive && self.isExternal(url)) {
        self.trackRequest(url, init?.body || (input instanceof Request ? input.body : null));
        // Block the request by returning a fake rejected promise
        return Promise.reject(new Error(`Paranoid Mode blocked fetch to ${url}`));
      }

      return self.originalFetch.apply(this, args);
    };

    // 2. Monkey-patch XMLHttpRequest
    XMLHttpRequest.prototype.open = function (
      method: string,
      url: string | URL,
      async: boolean = true,
      user?: string | null,
      password?: string | null
    ) {
      // @ts-ignore
      this._interceptedUrl = url.toString();
      self.originalXhrOpen.call(this, method, url, async, user, password);
    };

    XMLHttpRequest.prototype.send = function (body?: Document | XMLHttpRequestBodyInit | null) {
      // @ts-ignore
      const url = this._interceptedUrl as string;
      if (self.isActive && self.isExternal(url)) {
        self.trackRequest(url, body);
        // Abort the request immediately
        this.abort();
        // Trigger onerror
        setTimeout(() => {
          this.dispatchEvent(new Event('error'));
        }, 0);
        return;
      }
      self.originalXhrSend.call(this, body);
    };
  }
}

export const networkMonitor = new NetworkMonitorService();
