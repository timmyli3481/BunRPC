// src/dispatcher.ts
// This file is the entry point for the Bun subprocess. It listens for IPC messages
// and dispatches them to the appropriate RPC procedures defined in appRouter.

import { serve } from "../server";
import { appRouter } from "./appRouter";

// Start the IPC RPC server using the appRouter
serve(appRouter);