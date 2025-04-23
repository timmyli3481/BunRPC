import { Procedure } from "./rpc";

/**
 * Walk a dotted path ("users.getById") to locate a Procedure
 */
function getProcedure(router: any, path: string): Procedure<any, any> | undefined {
  return path.split(".").reduce((obj: any, key) => obj?.[key], router);
}

type Request = { id: number; method: string; params: any };
type Success = { id: number; result: any };
type Failure = { id: number; error: string };

/**
 * Listen on `process.on("message")` and dispatch to the router.
 * Uses Node©\style IPC (`process.send` / `process.on("message")`) :contentReference[oaicite:5]{index=5}.
 */
export function serve(router: Record<string, any>) {
  process.on("message", async (msg: Request) => {
    const { id, method, params } = msg;
    const proc = getProcedure(router, method);

    if (!proc) {
      return process.send!({ id, error: `Unknown method: ${method}` } as Failure);
    }

    try {
      const input = proc.input.parse(params);
      const result = await proc.resolve({ input });
      process.send!({ id, result } as Success);
    } catch (err: any) {
      process.send!({ id, error: err.message ?? "Internal error" } as Failure);
    }
  });
}
