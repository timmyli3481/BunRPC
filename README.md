# BunRPC

A tRPC-style IPC RPC library for Bun subprocesses using Zod for validation.

[![CI/CD](https://github.com/timmyli3481/bunrpc/actions/workflows/ci.yml/badge.svg)](https://github.com/timmyli3481/bunrpc/actions/workflows/ci.yml)

## Installation

```bash
bun add bunrpc
```

## Usage

### Define your RPC router

```typescript
// api.ts
import { initRpc } from 'bunrpc';
import { z } from 'zod';

export const rpc = initRpc();

export const appRouter = rpc.router({
  greet: rpc.procedure
    .input(z.object({ name: z.string() }))
    .resolve(({ input }) => {
      return `Hello ${input.name}!`;
    }),
  
  math: {
    add: rpc.procedure
      .input(z.object({ a: z.number(), b: z.number() }))
      .resolve(({ input }) => {
        return input.a + input.b;
      })
  }
});

export type AppRouter = typeof appRouter;
```

### Server-side: Serve the RPC router in a child process

```typescript
// child-process.ts
import { serve } from 'bunrpc';
import { appRouter } from './api';

// Start listening for IPC messages
serve(appRouter);

// Keep the process alive
process.stdin.resume();
```

### Client-side: Connect to the RPC router from the parent process

```typescript
// parent-process.ts
import { spawnRpcClient } from 'bunrpc';
import type { AppRouter } from './api';

async function main() {
  // Spawn child process and create typesafe client
  const { client, child } = spawnRpcClient<AppRouter>('bun', ['child-process.ts']);
  
  // Call procedures with full type-safety
  const greeting = await client.greet({ name: 'World' });
  console.log(greeting); // Hello World!
  
  const sum = await client.math.add({ a: 2, b: 3 });
  console.log(sum); // 5
  
  // Terminate the child process when done
  child.kill();
}

main().catch(console.error);
```

## Features

- Type-safe RPC between Bun parent and child processes
- Schema validation with Zod
- tRPC-style router definition API
- Promise-based API with support for async procedures

## Development

```bash
# Install dependencies
bun install

# Run tests
bun test

# Build
bun run build
```

## License

MIT 