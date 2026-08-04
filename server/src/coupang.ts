export interface Env {
  GEMINI_API_KEY: string;
  COUPANG_ACCESS_KEY: string;
  COUPANG_SECRET_KEY: string;
  COUPANG_SUB_ID?: string;
}

const DOMAIN = "https://api-gateway.coupang.com";
const DEEPLINK_PATH = "/v2/providers/affiliate_open_api/apis/openapi/v1/deeplink";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** 쿠팡파트너스 서명 규격: yyMMdd'T'HHmmss'Z' (UTC) */
function signedDate(): string {
  const d = new Date();
  const yy = String(d.getUTCFullYear()).slice(2);
  return `${yy}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return [...new Uint8Array(signature)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function buildAuthHeader(env: Env, method: string, path: string, query = ""): Promise<{ header: string; date: string }> {
  const date = signedDate();
  const message = date + method + path + query;
  const signature = await hmacSha256Hex(env.COUPANG_SECRET_KEY, message);
  return {
    header: `CEA algorithm=HmacSHA256, access-key=${env.COUPANG_ACCESS_KEY}, signed-date=${date}, signature=${signature}`,
    date,
  };
}

/**
 * 검색 키워드로 쿠팡파트너스 제휴 딥링크를 발급받아요.
 * API 실패 시에는 수수료 추적이 되지 않는 일반 검색 링크로 폴백해요(사용자 경험 우선).
 */
export async function createCoupangPartnersLink(env: Env, keyword: string): Promise<string> {
  const searchUrl = `https://www.coupang.com/np/search?component=&q=${encodeURIComponent(keyword)}`;

  if (!env.COUPANG_ACCESS_KEY || !env.COUPANG_SECRET_KEY) {
    return searchUrl;
  }

  try {
    const { header } = await buildAuthHeader(env, "POST", DEEPLINK_PATH);
    const res = await fetch(`${DOMAIN}${DEEPLINK_PATH}`, {
      method: "POST",
      headers: {
        Authorization: header,
        "Content-Type": "application/json;charset=UTF-8",
      },
      body: JSON.stringify({
        coupangUrls: [searchUrl],
        subId: env.COUPANG_SUB_ID || undefined,
      }),
    });

    if (!res.ok) return searchUrl;

    const json = (await res.json()) as {
      rCode?: string;
      data?: { shortenUrl?: string; landingUrl?: string }[];
    };

    const link = json.data?.[0]?.shortenUrl || json.data?.[0]?.landingUrl;
    return link || searchUrl;
  } catch {
    return searchUrl;
  }
}
