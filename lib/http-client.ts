import axios, { AxiosInstance } from "axios";

const BASE_URL = "https://supremecourt.govmu.org";

// Respectful scraping: rate-limit to 1 request per second
let lastRequestTime = 0;
const MIN_DELAY_MS = 1000;

async function rateLimit() {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_DELAY_MS) {
    await new Promise((r) => setTimeout(r, MIN_DELAY_MS - elapsed));
  }
  lastRequestTime = Date.now();
}

export function createHttpClient(): AxiosInstance {
  const client = axios.create({
    baseURL: BASE_URL,
    timeout: 30000,
    headers: {
      "User-Agent":
        "GovMU-LegalBot/1.0 (authorized chatbot scraper; contact: legal@govmu.org)",
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "en-US,en;q=0.9",
    },
    // Follow redirects
    maxRedirects: 5,
  });

  // Apply rate limiting before every request
  client.interceptors.request.use(async (config) => {
    await rateLimit();
    return config;
  });

  // Retry on transient errors (429, 503)
  client.interceptors.response.use(
    (res) => res,
    async (error) => {
      const status = error.response?.status;
      if ((status === 429 || status === 503) && !error.config._retried) {
        error.config._retried = true;
        const retryAfter = parseInt(error.response?.headers["retry-after"] || "5", 10);
        await new Promise((r) => setTimeout(r, retryAfter * 1000));
        return client(error.config);
      }
      throw error;
    }
  );

  return client;
}

export const BASE = BASE_URL;
