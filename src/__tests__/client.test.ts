import { describe, it, expect } from 'bun:test';
import { spawnRpcClient } from '../client';
import { appRouter } from './appRouter';

// Utility to get directory of this test file
const cwd = import.meta.dir;

describe('client-server integration', () => {
  it('echo procedure returns correct result', async () => {
    const { client, child } = spawnRpcClient<typeof appRouter>(
      ['bun', 'dispatcher.ts'],
      { cwd }
    );

    const res = await client.echo({ text: 'hello' });
    expect(res).toEqual({ text: 'hello' });
    child.kill();
  });

  it('add procedure sums numbers correctly', async () => {
    const { client, child } = spawnRpcClient<typeof appRouter>(
      ['bun', 'dispatcher.ts'],
      { cwd }
    );

    const res = await client.users.getById({ id: '123' });
    expect(res).toEqual({ id: '123', name: 'Alice', email: 'alice@example.com' });
    child.kill();
  });
});