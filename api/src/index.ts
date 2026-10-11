import { createApp } from "./app";
import { MemoryRepository } from "./repo";

// Demo: per-isolate memory store with synthetic data only.
const app = createApp(new MemoryRepository());

export default app;
