import { revalidateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";

/** Bust server-side caches after admin writes — keeps all views in sync */
export function bustServerCache() {
  revalidateTag(CACHE_TAGS.ADMIN, "max");
  revalidateTag(CACHE_TAGS.CONTRACTOR, "max");
  revalidateTag(CACHE_TAGS.PUBLIC, "max");
}
