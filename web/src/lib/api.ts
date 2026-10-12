/**
 * Thin client over the Worker API. Every failure becomes an ApiFailure; the UI must show it,
 * never fall back to a result it did not receive from the server.
 */
export const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://127.0.0.1:8787";

export interface ApiFailure {
  ok: false;
  status: number;
  code: string;
  message: string;
}
export interface ApiSuccess<T> {
  ok: true;
  data: T;
}
export type ApiResult<T> = ApiSuccess<T> | ApiFailure;

const USER_KEY = "napascare.demoUser";

/** Synthetic identity for the demo. It is not authentication. */
export function demoUser(): string {
  try {
    const existing = localStorage.getItem(USER_KEY);
    if (existing) return existing;
    const created = `demo-${crypto.randomUUID().slice(0, 8)}`;
    localStorage.setItem(USER_KEY, created);
    return created;
  } catch {
    return "demo-sementara";
  }
}

export async function api<T>(method: string, path: string, body?: unknown): Promise<ApiResult<T>> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        "X-Demo-User": demoUser(),
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const json = (await res.json().catch(() => null)) as unknown;
    if (!res.ok) {
      const e = (json as { error?: { code?: string; message?: string } } | null)?.error;
      return {
        ok: false,
        status: res.status,
        code: e?.code ?? "unknown",
        message: e?.message ?? "Permintaan gagal. Data tidak tersimpan.",
      };
    }
    return { ok: true, data: json as T };
  } catch {
    return {
      ok: false,
      status: 0,
      code: "network",
      message: "Tidak dapat terhubung ke layanan. Data tidak tersimpan; coba lagi.",
    };
  }
}
