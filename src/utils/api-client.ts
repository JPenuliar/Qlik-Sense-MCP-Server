export const apiClient = {
  async get(url: string, headers: Record<string, string> = {}) {
    console.log(`[API Client] GET ${url}`);
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      throw new Error(`GET request failed (${response.status}): ${errorText}`);
    }

    return await response.json();
  },

  async post(url: string, body: any, headers: Record<string, string> = {}) {
    console.log(`[API Client] POST ${url}`);
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      throw new Error(`POST request failed (${response.status}): ${errorText}`);
    }

    return await response.json();
  }
};
