# -*- coding: utf-8 -*-
"""냉장고 레시피 백엔드 매일 점검 (윈도우 작업 FridgeRecipe-WatchBackend).

/api/health 는 Worker 가 떠 있는지만 봐서 Gemini 키가 죽어도 ok 를 준다.
2026-08 중순~10-06 두 달간 키가 무효인 채로 아무도 몰랐다. 그래서 /api/health/deep 으로
Gemini 를 실제로 불러보고, 문제가 있을 때만 창을 띄운다. 결과는 매번 로그에 남긴다.

    python tools/watch_backend.py           # 점검 (문제 있으면 창)
    python tools/watch_backend.py --quiet   # 창 없이 결과만 출력
"""
import ctypes, datetime, io, json, os, sys, urllib.error, urllib.request

URL = "https://fridge-recipe-api.charry333.workers.dev/api/health/deep"
LOG = os.path.join(os.path.dirname(os.path.abspath(__file__)), "watch_backend.log")
TITLE = "냉장고 레시피 백엔드 점검"
FREE_WARN_BELOW = 3  # 살아 있는 무료 키가 이보다 적으면 경고


def check():
    req = urllib.request.Request(URL, headers={"User-Agent": "fridge-watch/1.0 (bot)"})
    try:
        with urllib.request.urlopen(req, timeout=90) as r:
            return r.status, json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        body = e.read().decode(errors="replace")
        try:
            return e.code, json.loads(body)
        except ValueError:
            return e.code, {"raw": body[:200]}
    except Exception as e:  # 네트워크 오류
        return 0, {"error": type(e).__name__}


def judge(status, data):
    """(문제 여부, 한 줄 요약)"""
    if status == 404:
        return True, "점검 주소가 없습니다(404). 고친 Worker가 아직 배포되지 않았습니다."
    if status == 0:
        return True, "Worker에 접속하지 못했습니다(%s)." % data.get("error")
    if status != 200 or not data.get("ok"):
        return True, "Gemini 호출이 전부 실패합니다(HTTP %s). 앱 추천이 모두 예시 화면으로 나갑니다." % status
    free_ok, total, paid_ok = data.get("freeOk", 0), data.get("freeTotal", 0), data.get("paidOk")
    if free_ok == 0:
        return True, "무료 키가 전부 막혀 유료 키로만 돌고 있습니다(하루 300회 상한)."
    if free_ok < FREE_WARN_BELOW:
        return True, "살아 있는 무료 키가 %d/%d개뿐입니다. gemi.env 키 점검이 필요합니다." % (free_ok, total)
    return False, "정상: 무료 키 %d/%d, 유료 %s, 모델 %s" % (free_ok, total, "ok" if paid_ok else "X", data.get("model"))


def main():
    quiet = "--quiet" in sys.argv
    status, data = check()
    bad, summary = judge(status, data)
    stamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    with io.open(LOG, "a", encoding="utf-8") as f:
        f.write("%s\t%s\t%s\t%s\n" % (stamp, "FAIL" if bad else "OK", status, summary))
    if quiet:
        print(("FAIL " if bad else "OK ") + summary)
    elif bad:
        body = summary + "\n\n확인: " + URL + "\n로그: " + LOG
        ctypes.windll.user32.MessageBoxW(0, body, TITLE, 0x30 | 0x40000)  # 경고 아이콘 + 맨 앞
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
