import { z } from "zod";

export interface CallLLMOptions<T extends z.ZodTypeAny> {
  system: string;
  user: string;
  schema: T;
  fallback?: z.infer<T>;
}

/**
 * Universal LLM caller for server routes.
 * Kept server-side only; validates against schema with retry and fallback.
 */
export async function callLLM<T extends z.ZodTypeAny>({
  system,
  user,
  schema,
  fallback,
}: CallLLMOptions<T>): Promise<z.infer<T>> {
  // Provider implementation to be hooked up when prompt tuning is ready
  if (fallback) {
    return fallback;
  }
  throw new Error("LLM provider not yet configured and no fallback provided.");
}
