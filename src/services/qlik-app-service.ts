import { logger } from '../utils/logger.js';
import { apiClient } from '../utils/api-client.js';

export class QlikAppService {
  async getTenantInfo(tenantId: string, context: any) {
    logger.info(`Fetching info for tenant: ${tenantId}`);
    
    // Ensure we have credentials
    if (!context.tenantUrl || !context.token) {
      throw new Error("Missing Qlik credentials. Please configure QLIK_TENANT_URL and QLIK_API_KEY in your .env file.");
    }

    // Clean up the URL format (ensure no trailing slash)
    const baseUrl = context.tenantUrl.replace(/\/$/, "");
    const headers = {
      "Authorization": `Bearer ${context.token}`
    };

    // If tenantId is "me" or a placeholder, query "/api/v1/tenants/me"
    const isMe = tenantId.toLowerCase() === "me" || !tenantId.match(/^[0-9a-fA-F-]{36}$/); // UUID format regex check
    const endpoint = isMe ? `${baseUrl}/api/v1/tenants/me` : `${baseUrl}/api/v1/tenants/${tenantId}`;
    
    try {
      const response = await apiClient.get(endpoint, headers);
      logger.info(`Successfully fetched tenant info for: ${tenantId}`);
      return response;
    } catch (error: any) {
      logger.error(`Failed to fetch tenant info for ${tenantId}:`, error.message);
      
      // If we queried a specific UUID and it failed, try "/api/v1/tenants/me" as a fallback
      if (!isMe) {
        logger.info(`Attempting fallback to /api/v1/tenants/me`);
        try {
          const fallbackResponse = await apiClient.get(`${baseUrl}/api/v1/tenants/me`, headers);
          return {
            note: `Tenant UUID '${tenantId}' was not found or accessible. Returned information for current connected tenant profile.`,
            ...fallbackResponse
          };
        } catch (fallbackError: any) {
          throw new Error(`Failed to fetch tenant info: ${error.message} (Fallback failed: ${fallbackError.message})`);
        }
      }
      throw error;
    }
  }

  async listApps(options: { limit?: number; next?: string }, context: any) {
    logger.info(`Listing apps (requested limit: ${options.limit || 50}, next: ${options.next || "none"})`);
    
    // Mock fallback if no credentials are configured
    if (!context.tenantUrl || !context.token) {
      logger.info("Credentials missing, returning mock apps page");
      const mockLimit = options.limit || 50;
      const mockNext = options.next ? parseInt(options.next, 10) : 0;
      
      const mockApps = Array.from({ length: mockLimit }, (_, i) => {
        const appIndex = mockNext * mockLimit + i + 1;
        return {
          appId: `app-uuid-${appIndex}`,
          itemId: `item-uuid-${appIndex}`,
          name: `Qlik App ${appIndex}`,
          description: `Mock Qlik Application ${appIndex}`,
          createdDate: new Date().toISOString()
        };
      });
      
      return {
        data: mockApps,
        next: mockNext < 2 ? String(mockNext + 1) : null // mock 3 pages total
      };
    }

    const baseUrl = context.tenantUrl.replace(/\/$/, "");
    const targetLimit = options.limit || 50;
    const headers = {
      "Authorization": `Bearer ${context.token}`
    };

    let allApps: any[] = [];
    let nextCursor: string | null = options.next || null;
    let hasMorePages = true;

    // Loop until we collect targetLimit apps or run out of pages
    while (allApps.length < targetLimit && hasMorePages) {
      // Determine request limit for this page (max 100 per Qlik guidelines)
      const remainingLimit = targetLimit - allApps.length;
      const requestLimit = Math.min(remainingLimit, 100);

      let endpoint = `${baseUrl}/api/v1/items?resourceType=app&limit=${requestLimit}`;
      if (nextCursor) {
        endpoint += `&next=${encodeURIComponent(nextCursor)}`;
      }

      logger.info(`Auto-paginating: fetching up to ${requestLimit} items (total retrieved so far: ${allApps.length})`);
      const response = await apiClient.get(endpoint, headers);

      const pageApps = (response.data || []).map((item: any) => ({
        appId: item.resourceId || item.id, // resourceId is the actual App ID, fallback to id
        itemId: item.id,
        name: item.name,
        description: item.description || "",
        createdDate: item.createdAt || item.createdDate || ""
      }));

      allApps = allApps.concat(pageApps);

      // Parse the next cursor for the next iteration
      if (response.links?.next?.href) {
        try {
          const url = new URL(response.links.next.href);
          nextCursor = url.searchParams.get("next");
        } catch (e) {
          // Fallback if links.next.href is relative
          const url = new URL(response.links.next.href, baseUrl);
          nextCursor = url.searchParams.get("next");
        }
      } else {
        nextCursor = null;
        hasMorePages = false;
      }

      // If we didn't receive any data in this page, break to prevent infinite loops
      if (pageApps.length === 0) {
        hasMorePages = false;
      }
    }

    return {
      data: allApps,
      next: nextCursor
    };
  }

  async compareScripts(appId1: string, appId2: string, context: any) {
    logger.info(`Comparing scripts for apps: ${appId1} and ${appId2}`);
    // Mock implementation for comparison tool (can be expanded later)
    return {
      app1: appId1,
      app2: appId2,
      differences: [
        { section: "Main", type: "Added", line: "SET ThousandSep=',';" },
        { section: "Load Data", type: "Modified", line: "LOAD * FROM [lib://DataFiles/sales.csv];" },
      ],
      summary: "Minor changes in data load section and formatting variables."
    };
  }
}

export const qlikAppService = new QlikAppService();
