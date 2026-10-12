import type { ApiError } from "../../shared/types";

export type AppEnv = { Variables: { userId: string } };

export const err = (code: string, message: string): ApiError => ({ error: { code, message } });

export interface Deps {
  now: () => Date;
}

export const defaultDeps: Deps = { now: () => new Date() };
