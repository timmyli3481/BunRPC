import { z } from "zod";
import { initRpc } from "../rpc";

const { procedure, router } = initRpc();

// Users sub-router
export const userRouter = router({
  getById: procedure
    .input(z.object({ id: z.string() })) // Accept any string for ID
    .resolve(async ({ input }) => ({
      id: input.id,
      name: "Alice",
      email: "alice@example.com",
    })),

  list: procedure
    .input(z.undefined())
    .resolve(() => [
      { id: "11111111-1111-1111-1111-111111111111", name: "Alice" },
      { id: "22222222-2222-2222-2222-222222222222", name: "Bob" },
    ]),
});

// Posts sub-router
export const postRouter = router({
  create: procedure
    .input(z.object({ title: z.string(), content: z.string() }))
    .resolve(({ input }) => ({
      id: Date.now().toString(),
      title: input.title,
      content: input.content,
    })),

  list: procedure
    .input(z.undefined())
    .resolve(() => [
      { id: "a", title: "Hello World", content: "This is a post." },
    ]),
});

// Top-level app router
export const appRouter = router({
  users: userRouter,
  posts: postRouter,
  echo: procedure
    .input(z.object({ text: z.string() }))
    .resolve(({ input }) => ({ text: input.text })),
});

export type AppRouter = typeof appRouter;
