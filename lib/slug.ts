export function normalizeSlug(raw: string): string {
  let slug = (raw ?? "").trim().toLowerCase();
  slug = slug.replace(/\/+/g, "/").replace(/^\/+|\/+$/g, "");
  slug = slug.replace(/\s+/g, "-");
  slug = slug.replace(/[^a-z0-9._~/-]/g, "");
  slug = slug.replace(/-{2,}/g, "-").replace(/\/{2,}/g, "/");
  return slug;
}