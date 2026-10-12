import { createApp } from "./app";
import { D1Repository } from "./repo/d1";

type Bindings = { DB?: D1Database };

export default {
  fetch(req: Request, env: Bindings, ctx: ExecutionContext) {
    // Never fall back to memory: an isolate-local store would report "tersimpan" falsely.
    if (!env.DB) {
      return Response.json(
        { error: { code: "internal", message: "Penyimpanan tidak tersedia; data tidak tersimpan." } },
        { status: 500 },
      );
    }
    return createApp(new D1Repository(env.DB)).fetch(req, env, ctx);
  },
};
