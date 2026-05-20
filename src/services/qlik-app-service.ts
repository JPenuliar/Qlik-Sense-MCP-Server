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
