// src/__tests__/client.test.ts
import { describe, it, expect } from "bun:test";
import { spawnRpcClient } from "../client";
import type { AppRouter } from "./appRouter";   // <- import the type

// Utility to get this test¡¯s directory
const cwd = import.meta.dir;

describe("client-server integration", () => {
  it("echo procedure returns correct result", async () => {
    const { client, child } = spawnRpcClient<AppRouter>(
      ["bun", "dispatcher.ts"],
      { cwd }
    );

    const res = await client.echo({ text: "hello" });
    expect(res).toEqual({ text: "hello" });
    child.kill();
  });

  it("users.getById returns a user object", async () => {
    const { client, child } = spawnRpcClient<AppRouter>(
      ["bun", "dispatcher.ts"],
      { cwd }
    );

    const res = await client.users.getById({ id: "123" });
    expect(res).toEqual({
      id: "123",
      name: "Alice",
      email: "alice@example.com",
    });
    child.kill();
  });
});
