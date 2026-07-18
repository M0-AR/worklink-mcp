const BASE_URL = "https://worklink.sy/api/partner";
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 3;
const RETRY_BASE_MS = 1_000;

export class WorkLinkClient {
  private token: string;
  private requestTimes: number[] = [];
  private readonly MAX_REQUESTS_PER_MINUTE = 120;

  constructor(token: string) {
    this.token = token;
  }

  private async throttle(): Promise<void> {
    const now = Date.now();
    this.requestTimes = this.requestTimes.filter((t) => now - t < 60_000);

    if (this.requestTimes.length >= this.MAX_REQUESTS_PER_MINUTE) {
      const oldest = this.requestTimes[0];
      const waitMs = 60_000 - (now - oldest) + 100;
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      this.requestTimes = this.requestTimes.filter(
        (t) => Date.now() - t < 60_000
      );
    }

    this.requestTimes.push(Date.now());
  }

  async fetch<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
    const url = new URL(`${BASE_URL}${path}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      await this.throttle();

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

        let res: Response;
        try {
          res = await fetch(url.toString(), {
            headers: {
              Authorization: `Bearer ${this.token}`,
              Accept: "application/json",
            },
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timeout);
        }

        if (res.status === 429) {
          const retryAfter = res.headers.get("Retry-After");
          const waitMs = retryAfter
            ? parseInt(retryAfter, 10) * 1000
            : RETRY_BASE_MS * Math.pow(2, attempt);
          if (attempt < MAX_RETRIES) {
            await new Promise((r) => setTimeout(r, waitMs));
            continue;
          }
        }

        if (!res.ok) {
          let errorMsg = `HTTP ${res.status}`;
          try {
            const body = await res.json() as Record<string, unknown>;
            errorMsg = (body.message as string) || (body.error as string) || errorMsg;
          } catch {
            // ignore parse error
          }
          throw new Error(`WorkLink API error (${res.status}): ${errorMsg}`);
        }

        return res.json() as Promise<T>;
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          lastError = new Error(`Request to ${path} timed out after ${REQUEST_TIMEOUT_MS / 1000}s`);
          if (attempt < MAX_RETRIES) {
            await new Promise((r) => setTimeout(r, RETRY_BASE_MS * Math.pow(2, attempt)));
            continue;
          }
        } else {
          throw error;
        }
      }
    }

    throw lastError ?? new Error(`Failed to fetch ${path} after ${MAX_RETRIES + 1} attempts`);
  }

  async getVacancies(params?: {
    page?: number;
    per_page?: number;
    category?: number;
    company?: number;
    open?: 0 | 1;
  }) {
    return this.fetch("/vacancies", params);
  }

  async getVacancy(slug: string) {
    return this.fetch(`/vacancies/${encodeURIComponent(slug)}`);
  }

  async getTenders(params?: {
    page?: number;
    per_page?: number;
    category?: number;
    company?: number;
    open?: 0 | 1;
  }) {
    return this.fetch("/tenders", params);
  }

  async getTender(slug: string) {
    return this.fetch(`/tenders/${encodeURIComponent(slug)}`);
  }
}
