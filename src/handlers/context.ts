import "dotenv/config";

export interface ExecutionContext {
  token?: string;
  tenantUrl?: string;
  platformFlags?: Record<string, boolean>;
}

export const defaultContext: ExecutionContext = {
  token: process.env.QLIK_API_KEY,
  tenantUrl: process.env.QLIK_TENANT_URL,
  platformFlags: {}
};
