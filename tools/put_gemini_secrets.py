# -*- coding: utf-8 -*-
"""D:\\00 cloud\\gemi.env 의 키를 Worker 비밀값(GEMINI_FREE_KEYS·GEMINI_PAID_KEY)으로 넣는다.
키 값은 화면에 출력하지 않는다. 등록 뒤 `cd server && npx wrangler deploy` 로 배포한다.

    python tools/put_gemini_secrets.py
"""
import os, subprocess, sys
sys.path.insert(0, r"D:\00 cloud")
from gemi import load_keys

SERVER = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "server")
# 2026-10-07 실측: 무료 6번·8번 키는 모든 모델에서 403("project has been denied access")
DEAD_FREE = {5, 7}


def put(name, value):
    r = subprocess.run("npx wrangler secret put " + name, cwd=SERVER, input=value, shell=True,
                       capture_output=True, text=True, encoding="utf-8", errors="replace")
    ok = r.returncode == 0
    print("%s %s" % (name, "등록됨" if ok else "실패 (exit %d)" % r.returncode))
    if not ok:
        print((r.stderr or r.stdout)[-400:])
    return ok


def main():
    free, paid = load_keys()
    free_ok = [k for i, k in enumerate(free) if i not in DEAD_FREE]
    print("무료 키 %d개 (전체 %d개 중 죽은 키 %d개 제외)" % (len(free_ok), len(free), len(DEAD_FREE)))
    ok = put("GEMINI_FREE_KEYS", ",".join(free_ok))
    if paid:
        ok = put("GEMINI_PAID_KEY", paid[0]) and ok
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
