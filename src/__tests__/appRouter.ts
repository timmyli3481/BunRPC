import { z } from "zod";
import { initRpc } from "../rpc";

const { procedure, router } = initRpc();

// Example of a nested user router
export const userRouter = router({
  getById: procedure
    .input(z.object({ id: z.string().uuid() }))
    .resolve(async ({ input }) => {
      // Dummy data fetch simulation
      return {
        id: input.id,
        name: "Alice",
        email: "alice@example.com",
      };
    }),

  list: procedure
    .input(z.undefined())
    .resolve(() => [
      { id: "11111111-1111-1111-1111-111111111111", name: "Alice" },
      { id: "22222222-2222-2222-2222-222222222222", name: "Bob" },
    ]),
});

// Example of a nested post router
export const postRouter = router({
  create: procedure
    .input(
      z.object({ title: z.string(), content: z.string() })
    )
    .resolve(({ input }) => ({ id: Date.now().toString(), ...input })),

  list: procedure
    .input(z.undefined())
    .resolve(() => [
      { id: "a", title: "Hello World", content: "This is a post." },
    ]),
});

// Top-level application router combining sub-routers
export const appRouter = router({
  users: userRouter,
  posts: postRouter,

  // Additional standalone procedure
  echo: procedure
    .input(z.object({ text: z.string() }))
    .resolve(({ input }) => ({ text: input.text })),
});

// Export type for client inference
export type AppRouter = typeof appRouter;
