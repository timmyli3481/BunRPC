// src/rpc.ts
import { z, ZodTypeAny } from "zod";

/**
 * A single RPC procedure:
 *  - `input` is the Zod schema for validation
 *  - `resolve` returns either T or Promise<T>
 */
export type Procedure<I extends ZodTypeAny, T> = {
  input: I;
  resolve: (opts: { input: z.infer<I> }) => Promise<T> | T;
};

/**
 * Factory that gives you:
 *  - `procedure` to build a Procedure<I,T>
 *  - `router` to collect them (or nested routers) into an appRouter
 */
export function initRpc() {
  const procedure = {
    input: <I extends ZodTypeAny>(schema: I) => ({
      resolve: <T>(
        fn: (opts: { input: z.infer<I> }) => Promise<T> | T
      ): Procedure<I, T> => ({
        input: schema,
        resolve: fn,
      }),
    }),
  };

  /**
   * `router()` now accepts _any_ nested object.
   * You lose no inference on return types,
   * but avoid the invariance bug that was blocking your nested routers.
   */
  function router<T extends Record<string, any>>(routes: T): T {
    return routes;
  }

  return { procedure, router };
}
