import { createCoupangPartnersLink, type Env as CoupangEnv } from "./coupang";
import {
  analyzeFridgeImage,
  analyzeIngredientList,
  checkGeminiKeys,
  fetchMoreRecipes,
  recommendTodayMenu,
  type GeminiEnv,
  type RecipeSource,
} from "./gemini";

export interface Env extends CoupangEnv, GeminiEnv {
  /** IP당 요청 수 제한 (wrangler.jsonc ratelimits) */
  RL?: RateLimit;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

/** 1024px JPEG 은 base64 로 수백 KB 예요. 이보다 크면 정상 앱 요청이 아니에요. */
const MAX_IMAGE_BASE64_LENGTH = 4_000_000;

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

/** 원문 오류(키 상태 등)는 로그로만 남기고, 앱에는 고정 문구만 돌려줘요. */
function failure(err: unknown, message: string): Response {
  console.error(err instanceof Error ? err.message : String(err));
  return json({ error: message }, 500);
}

async function isRateLimited(request: Request, env: Env, bucket: string): Promise<boolean> {
  if (!env.RL) return false;
  const ip = request.headers.get("CF-Connecting-IP") ?? "anonymous";
  const { success } = await env.RL.limit({ key: `${bucket}:${ip}` });
  return !success;
}

const GEMINI_PATHS = new Set(["/api/analyze", "/api/analyze-text", "/api/recommend-today", "/api/more-recipes"]);

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    if (url.pathname === "/api/health") {
      return json({ ok: true });
    }

    // Gemini 를 실제로 불러보는 점검. /api/health 는 키가 죽어도 ok 를 줘서 두 달간 고장을 못 봤어요.
    if (url.pathname === "/api/health/deep") {
      if (await isRateLimited(request, env, "health")) return json({ error: "too many requests" }, 429);
      const report = await checkGeminiKeys(env);
      return json(report, report.ok ? 200 : 503);
    }

    if (GEMINI_PATHS.has(url.pathname) && request.method === "POST") {
      if (await isRateLimited(request, env, "gemini")) {
        return json({ error: "요청이 많아요. 잠시 후 다시 시도해주세요." }, 429);
      }
    }

    if (url.pathname === "/api/analyze" && request.method === "POST") {
      try {
        const { imageBase64 } = (await request.json()) as { imageBase64?: string };
        if (!imageBase64) return json({ error: "imageBase64가 필요해요." }, 400);
        if (imageBase64.length > MAX_IMAGE_BASE64_LENGTH) return json({ error: "사진이 너무 커요." }, 413);

        const result = await analyzeFridgeImage(env, imageBase64);
        return json(result);
      } catch (err) {
        return failure(err, "분석에 실패했어요.");
      }
    }

    if (url.pathname === "/api/analyze-text" && request.method === "POST") {
      try {
        const { ingredients } = (await request.json()) as { ingredients?: string[] };
        if (!ingredients || ingredients.length === 0) return json({ error: "ingredients가 필요해요." }, 400);

        const result = await analyzeIngredientList(env, ingredients.slice(0, 30));
        return json(result);
      } catch (err) {
        return failure(err, "분석에 실패했어요.");
      }
    }

    if (url.pathname === "/api/recommend-today" && request.method === "POST") {
      try {
        const result = await recommendTodayMenu(env);
        return json(result);
      } catch (err) {
        return failure(err, "추천에 실패했어요.");
      }
    }

    if (url.pathname === "/api/more-recipes" && request.method === "POST") {
      try {
        const { imageBase64, ingredients, excludeNames } = (await request.json()) as {
          imageBase64?: string;
          ingredients?: string[];
          excludeNames?: string[];
        };
        if (imageBase64 && imageBase64.length > MAX_IMAGE_BASE64_LENGTH) {
          return json({ error: "사진이 너무 커요." }, 413);
        }

        let source: RecipeSource = {};
        if (imageBase64) source = { imageBase64 };
        else if (ingredients?.length) source = { ingredients: ingredients.slice(0, 30) };

        const recipes = await fetchMoreRecipes(env, (excludeNames ?? []).slice(0, 10), source);
        return json({ recipes });
      } catch (err) {
        return failure(err, "추가 추천에 실패했어요.");
      }
    }

    if (url.pathname === "/api/coupang-link" && request.method === "POST") {
      try {
        const { keyword } = (await request.json()) as { keyword?: string };
        if (!keyword) return json({ error: "keyword가 필요해요." }, 400);

        const link = await createCoupangPartnersLink(env, keyword);
        return json({ url: link });
      } catch (err) {
        return failure(err, "링크 생성에 실패했어요.");
      }
    }

    return json({ error: "Not found" }, 404);
  },
};
