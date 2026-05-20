export const apiClient = {
  async get(url: string, headers: Record<string, string> = {}) {
    // Basic mock API client for HTTP GET requests
    console.log(`[API Client] GET ${url}`);
    return { data: "mock payload" };
  },
  async post(url: string, body: any, headers: Record<string, string> = {}) {
    // Basic mock API client for HTTP POST requests
    console.log(`[API Client] POST ${url}`);
    return { data: "mock post payload" };
  }
};
