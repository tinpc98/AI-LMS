/**
 * Environmental Configuration Helper V2
 */

export const sanitizeDomain = (rawDomain?: string): string => {
  if (!rawDomain) return "8x8.vc";
  let domain = rawDomain.trim();
  domain = domain.replace(/^https?:\/\//i, "");
  domain = domain.replace(/\/.*$/, "");
  return domain || "8x8.vc";
};

export const envConfig = {
  get jaasDomain(): string {
    return sanitizeDomain(import.meta.env.VITE_JAAS_DOMAIN);
  },
  get apiUrl(): string {
    return import.meta.env.VITE_API_URL || "http://localhost:5000";
  },
  get socketUrl(): string {
    return import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";
  },
};

export default envConfig;
