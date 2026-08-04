import { createCoupangPartnersLink, type Env as CoupangEnv } from "./coupang";
import { analyzeFridgeImage, fetchMoreRecipes } from "./gemini";

export interface Env extends CoupangEnv {}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    if (url.pathname === "/api/health") {
      return json({ ok: true });
    }

    if (url.pathname === "/api/analyze" && request.method === "POST") {
      try {
        const { imageBase64 } = (await request.json()) as { imageBase64?: string };
        if (!imageBase64) return json({ error: "imageBase64가 필요해요." }, 400);

        const result = await analyzeFridgeImage(env, imageBase64);
        return json(result);
      } catch (err) {
        return json({ error: err instanceof Error ? err.message : "분석에 실패했어요." }, 500);
      }
    }

    if (url.pathname === "/api/more-recipes" && request.method === "POST") {
      try {
        const { imageBase64, excludeNames } = (await request.json()) as {
          imageBase64?: string;
          excludeNames?: string[];
        };
        if (!imageBase64) return json({ error: "imageBase64가 필요해요." }, 400);

        const recipes = await fetchMoreRecipes(env, imageBase64, excludeNames ?? []);
        return json({ recipes });
      } catch (err) {
        return json({ error: err instanceof Error ? err.message : "추가 추천에 실패했어요." }, 500);
      }
    }

    if (url.pathname === "/api/coupang-link" && request.method === "POST") {
      try {
        const { keyword } = (await request.json()) as { keyword?: string };
        if (!keyword) return json({ error: "keyword가 필요해요." }, 400);

        const link = await createCoupangPartnersLink(env, keyword);
        return json({ url: link });
      } catch (err) {
        return json({ error: err instanceof Error ? err.message : "링크 생성에 실패했어요." }, 500);
      }
    }

    return json({ error: "Not found" }, 404);
  },
};
