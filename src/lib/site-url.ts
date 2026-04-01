const DEFAULT_SITE_URL = "https://transcripthub.com";

function normalizeSiteUrl(raw?: string | null): string {
  const value = (raw || "").trim();
  if (!value) return DEFAULT_SITE_URL;
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  return withProtocol.replace(/\/+$/, "");
}

export function getSiteUrl(): string {
  return normalizeSiteUrl(
    process.env.NEXT_PUBLIC_APP_BASE_URL || process.env.APP_BASE_URL || DEFAULT_SITE_URL
  );
}

export function getAbsoluteUrl(pathname: string): string {
  return new URL(pathname, `${getSiteUrl()}/`).toString();
}
