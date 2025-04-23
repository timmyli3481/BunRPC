import { describe, it, expect } from 'bun:test';
import { initRpc } from '../rpc';
import { z } from 'zod';

describe('rpc builder', () => {
  const { procedure, router } = initRpc();

  it('should build a simple procedure and resolve correctly', () => {
    const proc = procedure
      .input(z.object({ msg: z.string() }))
      .resolve(({ input }) => ({ echo: input.msg }));

    // Valid input
    const parsed = proc.input.parse({ msg: 'test' });
    expect(parsed.msg).toBe('test');
    const result = proc.resolve({ input: parsed });
    expect(result).toEqual({ echo: 'test' });
  });

  it('router should register procedures correctly', () => {
    const myRouter = router({
      ping: procedure
        .input(z.undefined())
        .resolve(() => ({ pong: true })),
    });

    expect(myRouter).toHaveProperty('ping');
    const proc = myRouter.ping;
    expect(typeof proc.resolve).toBe('function');
    expect(proc.input.parse(undefined)).toBeUndefined();
  });

  it('input validation should throw on invalid data', () => {
    const numProc = procedure
      .input(z.number())
      .resolve(({ input }) => input * 2);

    expect(() => numProc.input.parse('not a number')).toThrow();
  });
});