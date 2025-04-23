// src/client.ts
import { Subprocess } from "bun";
import type { Procedure } from "./rpc";
import { z } from "zod";

// Recursively map your router type to a client API:
// - If a key is a Procedure<I, O>, make it (params: z.infer<I>) => Promise<O>
// - If a key is a nested object, recurse
type RpcClient<TRouter> = {
  [K in keyof TRouter]: TRouter[K] extends Procedure<infer I, infer O>
    ? (params: z.infer<I>) => Promise<O>
    : TRouter[K] extends Record<string, any>
    ? RpcClient<TRouter[K]>
    : never;
};

type BunSpawnArgs = Parameters<typeof Bun.spawn>;
type SpawnCmd = BunSpawnArgs[0];
type SpawnOpts = Omit<BunSpawnArgs[1], "ipc">;

/**
 * Spawn a Bun subprocess exactly like Bun.spawn(cmd, opts),
 * but inject your own IPC handler to wire up RPC.
 *
 * @param cmd Bun.spawn command (string or string[])
 * @param opts Bun.spawn options, except `ipc`
 * @returns an RPC client proxy matching your router, plus the raw child
 */
export function spawnRpcClient<TRouter extends Record<string, any>>(
  cmd: SpawnCmd,
  opts?: SpawnOpts
): { client: RpcClient<TRouter>; child: Subprocess } {
  let counter = 0;
  const pending = new Map<
    number,
    { resolve(v: any): void; reject(e: any): void }
  >();

  // Spawn with our injected IPC handler
  const child = Bun.spawn(cmd, {
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
      if (error) entry.reject(new Error(error));
      else entry.resolve(result);
    },
  });

  // Build a Proxy that sends {id, method, params} and returns a Promise
  const client = new Proxy(
    {},
    {
      get(_, key: string) {
        // Accessing client.someMethod or client.nested.method
        return (params: any) =>
          new Promise((resolve, reject) => {
            const id = ++counter;
            pending.set(id, { resolve, reject });
            child.send({ id, method: key, params });
          });
      },
    }
  ) as RpcClient<TRouter>;

  return { client, child };
}
