function readEnv(...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = process.env[key];
    if (value) return value;
  }
  return undefined;
}

const PLACEHOLDER_PATTERNS = [
  "YOUR_PROJECT",
  "your_supabase",
  "your-project",
  "xxxx",
  "eyJ...",
  "...",
  "placeholder",
  "changeme",
];

function isPlaceholder(value: string): boolean {
  const lower = value.toLowerCase();
  return PLACEHOLDER_PATTERNS.some((p) => lower.includes(p.toLowerCase()));
}

export function getSupabaseUrl(): string {
  return readEnv("NEXT_PUBLIC_SUPABASE_URL", "VITE_SUPABASE_URL") ?? "";
}

export function getSupabaseAnonKey(): string {
  return readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "VITE_SUPABASE_ANON_KEY") ?? "";
}

export function getSupabaseServiceRoleKey(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
}

export function getAdminPin(): string {
  const pin = readEnv("ADMIN_PIN", "VITE_ADMIN_PIN");
  if (pin) return pin.trim();
  if (process.env.NODE_ENV === "development") return "123456";
  return "";
}

/** Public site URL for QR codes and deep links (set in production) */
export function getAppUrl(): string {
  const explicit = readEnv("NEXT_PUBLIC_APP_URL");
  if (explicit && !isPlaceholder(explicit)) {
    const url = explicit.trim().replace(/\/$/, "");
    return url.startsWith("http") ? url : `https://${url}`;
  }

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel}`;

  return "";
}

export function isSupabaseConfigured(): boolean {
  const url = getSupabaseUrl().trim();
  const serviceKey = getSupabaseServiceRoleKey().trim();

  if (!url || !serviceKey) return false;
  if (isPlaceholder(url) || isPlaceholder(serviceKey)) return false;
  if (!url.includes("supabase.co")) return false;
  // Valid JWT has 3 dot-separated parts
  if (serviceKey.split(".").length !== 3) return false;

  return true;
}
