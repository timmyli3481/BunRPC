// src/client.ts
import { spawn, Subprocess } from "bun";
import type { Procedure } from "./rpc";
import { z } from "zod";

/**
 * Map your router¡¯s shape into a client API:
 * - If a key is a Procedure<I, O>, expose (params: z.infer<I>) => Promise<O>
 * - If a key is a nested router, recurse
 */
type RpcClient<TRouter> = {
  [K in keyof TRouter]: TRouter[K] extends Procedure<infer I, infer O>
    ? (params: z.infer<I>) => Promise<O>
    : TRouter[K] extends Record<string, any>
    ? RpcClient<TRouter[K]>
    : never;
};

/**
 * Spawn a Bun subprocess exactly like `spawn(cmd, opts)`,
 * but inject our IPC handler so you get a type-safe RPC client.
 */
export function spawnRpcClient<TRouter extends Record<string, any>>(
  cmd: Parameters<typeof spawn>[0],
  opts?: Omit<Parameters<typeof spawn>[1], "ipc">
): { client: RpcClient<TRouter>; child: Subprocess } {
  let counter = 0;
  const pending = new Map<
    number,
    { resolve(v: any): void; reject(e: any): void }
  >();

  // 1) Spawn with injected IPC handler
  const child = spawn(cmd, {
    ...(opts ?? {}),
    ipc(message) {
      const { id, result, error } = message as {
        id: number;
        result?: any;
        error?: string;
      };
      const entry = pending.get(id);
      if (!entry) return;
      pending.delete(id);
      error ? entry.reject(new Error(error)) : entry.resolve(result);
    },
  });

  // 2) Build a nested Proxy for any depth of router
  function buildProxy(path = ""): any {
    return new Proxy(() => {}, {
      get(_, prop: string) {
        const nextPath = path ? `${path}.${prop}` : prop;
        return buildProxy(nextPath);
      },
      apply(_, __, [params]: [any]) {
        return new Promise((resolve, reject) => {
          const id = ++counter;
          pending.set(id, { resolve, reject });
          child.send({ id, method: path, params });
        });
      },
    });
  }

  // 3) Return the typed client and raw child
  return {
    client: buildProxy() as RpcClient<TRouter>,
    child,
  };
}
