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
    const url = import.meta.env.VITE_API_URL;
    if (!url) {
      if (import.meta.env.PROD) throw new Error("VITE_API_URL is missing in production environment");
      return "http://localhost:5000/api"; // Chỉ được phép fallback khi chạy local (development)
    }
    return url;
  },
  get socketUrl(): string {
    const url = import.meta.env.VITE_SOCKET_URL;
    if (!url) {
      if (import.meta.env.PROD) throw new Error("VITE_SOCKET_URL is missing in production environment");
      return "http://localhost:5000"; // Chỉ được phép fallback khi chạy local (development)
    }
    return url;
  },
};

export default envConfig;
