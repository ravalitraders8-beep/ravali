import type { SupabaseClient } from "@supabase/supabase-js";

const PREFIX_MAP: Record<string, string> = {
  Painter: "PAINT",
  Electrician: "ELEC",
  Plumber: "PLMB",
  Mason: "MASN",
  Carpenter: "CARP",
};

export function categoryQrPrefix(categoryNameEnglish: string): string {
  const name = categoryNameEnglish.trim();
  return PREFIX_MAP[name] ?? "CTR";
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function formatQrToken(prefix: string, num: number): string {
  return `CTR-${prefix}-${String(num).padStart(3, "0")}`;
}

function maxSuffixForPrefix(tokens: string[], prefix: string): number {
  const suffixRe = new RegExp(`^CTR-${escapeRegex(prefix)}-(\\d+)$`, "i");
  let maxNum = 0;
  for (const token of tokens) {
    const m = token.match(suffixRe);
    if (m) maxNum = Math.max(maxNum, parseInt(m[1], 10));
  }
  return maxNum;
}

/** Load every qr_token (paginated) — avoids ilike gaps and default row limits. */
export async function fetchAllQrTokens(supabase: SupabaseClient): Promise<string[]> {
  const tokens: string[] = [];
  const pageSize = 500;
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("contractors")
      .select("qr_token")
      .order("qr_token", { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) throw error;
    if (!data?.length) break;

    for (const row of data) {
      const t = String(row.qr_token ?? "").trim();
      if (t) tokens.push(t);
    }

    if (data.length < pageSize) break;
    from += pageSize;
  }

  return tokens;
}

/** Prefer DB function when migration 006 is applied. */
async function allocateViaRpc(
  supabase: SupabaseClient,
  prefix: string
): Promise<string | null> {
  const { data, error } = await supabase.rpc("allocate_contractor_qr_token", {
    p_prefix: prefix,
  });
  if (error) {
    if (
      error.message.includes("allocate_contractor_qr_token") ||
      error.code === "PGRST202"
    ) {
      return null;
    }
    throw error;
  }
  const token = typeof data === "string" ? data.trim() : "";
  return token || null;
}

export async function allocateQrToken(
  supabase: SupabaseClient,
  prefix: string,
  startAfterSuffix?: number
): Promise<string> {
  const fromRpc = await allocateViaRpc(supabase, prefix);
  if (fromRpc) return fromRpc;

  const tokens = await fetchAllQrTokens(supabase);
  const maxNum = Math.max(maxSuffixForPrefix(tokens, prefix), startAfterSuffix ?? 0);
  return formatQrToken(prefix, maxNum + 1);
}

export type ContractorUniqueError = "qr_token" | "phone" | "other";

export function parseContractorUniqueError(
  message: string,
  code?: string
): ContractorUniqueError {
  const m = message.toLowerCase();
  if (m.includes("contractors_phone_key") || (m.includes("phone") && m.includes("unique"))) {
    return "phone";
  }
  if (m.includes("contractors_qr_token_key") || (m.includes("qr_token") && m.includes("unique"))) {
    return "qr_token";
  }
  if (code === "23505") {
    if (m.includes("phone")) return "phone";
    if (m.includes("qr_token")) return "qr_token";
  }
  return "other";
}

export function isQrTokenDuplicateError(message: string, code?: string): boolean {
  return parseContractorUniqueError(message, code) === "qr_token";
}

export function isPhoneDuplicateError(message: string, code?: string): boolean {
  return parseContractorUniqueError(message, code) === "phone";
}

export async function findContractorByPhone(
  supabase: SupabaseClient,
  phone: string
): Promise<{ id: string; name_english: string; qr_token: string } | null> {
  const { data, error } = await supabase
    .from("contractors")
    .select("id, name_english, qr_token")
    .eq("phone", phone)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Insert contractor with a unique qr_token.
 * On qr_token collision, bumps suffix and retries (does not reuse the same token).
 */
export async function insertContractorWithUniqueQr(
  supabase: SupabaseClient,
  prefix: string,
  payload: Record<string, unknown>
): Promise<{ data: Record<string, unknown>; qr_token: string }> {
  const tokens = await fetchAllQrTokens(supabase);
  let nextSuffix = maxSuffixForPrefix(tokens, prefix) + 1;
  let lastError: { message: string; code?: string } | null = null;

  for (let attempt = 0; attempt < 40; attempt++) {
    const qr_token = formatQrToken(prefix, nextSuffix);
    const result = await supabase
      .from("contractors")
      .insert({ ...payload, qr_token })
      .select()
      .single();

    if (!result.error && result.data) {
      return { data: result.data as Record<string, unknown>, qr_token };
    }

    lastError = result.error;
    const kind = parseContractorUniqueError(
      result.error?.message ?? "",
      result.error?.code
    );

    if (kind === "phone") {
      throw Object.assign(new Error("phone_duplicate"), {
        cause: result.error,
      });
    }

    if (kind === "qr_token") {
      nextSuffix += 1;
      continue;
    }

    throw result.error;
  }

  throw lastError ?? new Error("Could not assign a unique member ID");
}
