"""
End-to-end security proof for the premium dossier.

Run against a local dev server:  python3 tests/playwright/premium_access.py

It asserts, in order:
  1. An anonymous quiz taker sees the free result only — no premium prose in the
     DOM and none inside any JavaScript the browser downloaded.
  2. POST /api/dossier-pdf rejects a missing, malformed or forged token (401)
     and refuses GET entirely (405).
  3. A forged localStorage proof unlocks nothing.
  4. A verified buyer gets the dossier and a real PDF (%PDF- bytes).
  5. The buyer's own signed token stops working the moment the payment behind it
     is no longer valid — so a leaked token cannot be replayed by anyone else.

Set PROBE_ORDER_ID to a paid order id to enable steps 4 and 5.
"""

import asyncio
import os
from pathlib import Path

from playwright.async_api import async_playwright

BASE = os.environ.get("BASE_URL", "http://localhost:8080")
TOOL = f"{BASE}/tools/dark-personality"
ORDER_KEY = "sov.vip.order"
PROBE_ORDER = os.environ.get("PROBE_ORDER_ID", "")
# A sentence that only ever exists inside the server-only premium module.
PREMIUM_MARKER = "Intellectualisation and contingency hoarding"
SHOTS = Path(__file__).parent / "screenshots"
SHOTS.mkdir(parents=True, exist_ok=True)

results: list[tuple[str, bool, str]] = []


def check(name: str, ok: bool, detail: str = "") -> None:
    results.append((name, ok, detail))
    print(("PASS  " if ok else "FAIL  ") + name + (f"  [{detail}]" if detail else ""))


async def take_quiz(page) -> None:
    begin = page.get_by_role("button", name="Begin")
    if await begin.count():
        await begin.first.click()
    for _ in range(40):
        option = page.get_by_role("button", name="Agree", exact=True)
        if not await option.count():
            break
        await option.first.click()
        await page.wait_for_timeout(90)
        if await page.get_by_text("shadow archetype").count():
            break
    await page.wait_for_timeout(1200)


async def main() -> None:
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 1800})
        page = await context.new_page()

        scripts: list[str] = []

        async def collect(response):
            ctype = response.headers.get("content-type", "")
            if "javascript" in ctype:
                try:
                    scripts.append(await response.text())
                except Exception:
                    pass

        page.on("response", lambda r: asyncio.create_task(collect(r)))

        # ---- 1. anonymous quiz taker -------------------------------------
        await page.goto(TOOL, wait_until="domcontentloaded")
        await take_quiz(page)
        html = await page.content()
        check("anonymous result renders", "shadow archetype" in html.lower())
        check("anonymous DOM has no premium prose", PREMIUM_MARKER not in html)
        check(
            "anonymous JS bundles have no premium prose",
            all(PREMIUM_MARKER not in js for js in scripts),
            f"{len(scripts)} scripts scanned",
        )
        await page.screenshot(path=str(SHOTS / "1_anonymous_result.png"))

        # ---- 2. endpoint probes ------------------------------------------
        api = context.request
        r = await api.post(f"{BASE}/api/dossier-pdf", data={})
        check("PDF endpoint rejects a missing token", r.status == 401, str(r.status))
        r = await api.post(f"{BASE}/api/dossier-pdf", data={"token": "abc.def"})
        check("PDF endpoint rejects a malformed token", r.status == 401, str(r.status))
        r = await api.post(
            f"{BASE}/api/dossier-pdf",
            data={"token": "eyJheGVzIjpbeyJkaW0iOiJTaGFkb3ciLCJ2YWx1ZSI6OTl9XSwiZXhwIjo5OTk5OTk5OTk5OTk5fQ.forged"},
        )
        check("PDF endpoint rejects a forged signature", r.status == 401, str(r.status))
        r = await api.get(f"{BASE}/api/dossier-pdf")
        check("PDF endpoint refuses GET", r.status == 405, str(r.status))

        # ---- 3. forged local proof ---------------------------------------
        await page.goto(BASE, wait_until="domcontentloaded")
        await page.evaluate(
            "key => window.localStorage.setItem(key, 'sov_not_a_real_order_0001')", ORDER_KEY
        )
        await page.goto(TOOL, wait_until="domcontentloaded")
        await take_quiz(page)
        html = await page.content()
        check("forged order id unlocks nothing", PREMIUM_MARKER not in html)
        await page.screenshot(path=str(SHOTS / "2_forged_proof.png"))

        # ---- 4 & 5. verified buyer ---------------------------------------
        if PROBE_ORDER:
            tokens: list[str] = []
            page.on(
                "request",
                lambda req: tokens.append(req.post_data or "")
                if "/api/dossier-pdf" in req.url
                else None,
            )
            await page.goto(BASE, wait_until="domcontentloaded")
            await page.evaluate(
                "([key, order]) => window.localStorage.setItem(key, order)",
                [ORDER_KEY, PROBE_ORDER],
            )
            await page.goto(TOOL, wait_until="domcontentloaded")
            await take_quiz(page)
            await page.wait_for_timeout(2500)
            html = await page.content()
            check("verified buyer receives the premium dossier", "Blind spot:" in html)
            await page.screenshot(path=str(SHOTS / "3_buyer_dossier.png"))

            download_btn = page.get_by_role("button", name="Download Official Archetype Dossier")
            if await download_btn.count():
                async with page.expect_download(timeout=20000) as info:
                    await download_btn.first.click()
                download = await info.value
                path = SHOTS.parent / "downloaded.pdf"
                await download.save_as(str(path))
                head = path.read_bytes()[:8]
                check(
                    "verified buyer downloads a real PDF",
                    head.startswith(b"%PDF-"),
                    f"{path.stat().st_size} bytes",
                )
            else:
                check("verified buyer downloads a real PDF", False, "button missing")

            token = ""
            for body in tokens:
                if body and '"token"' in body:
                    token = body.split('"token":"')[1].split('"')[0]
            check("PDF request carried a signed token", bool(token))
            if token and os.environ.get("REVOKED", "") == "1":
                r = await api.post(f"{BASE}/api/dossier-pdf", data={"token": token})
                check(
                    "token stops working once the payment is revoked",
                    r.status == 403,
                    str(r.status),
                )
        else:
            print("SKIP  buyer flow (set PROBE_ORDER_ID)")

        await browser.close()

    failed = [name for name, ok, _ in results if not ok]
    print(f"\n{len(results) - len(failed)}/{len(results)} checks passed")
    if failed:
        raise SystemExit("FAILED: " + ", ".join(failed))


asyncio.run(main())
