"""Test Forklore login (User + Admin) via Playwright."""
from playwright.sync_api import sync_playwright

URL = "https://forklore.mmind.space"
USER_EMAIL = "admin@forklore.local"
USER_PASSWORD = "admin123"
ADMIN_PASSWORD = "admin123"  # from .env ADMIN_PASSWORD

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.set_default_timeout(25000)

        # 1. User login (NextAuth credentials)
        print("1. Testing user login at /login...")
        page.goto(f"{URL}/login")
        page.wait_for_load_state("networkidle")
        page.fill("#email", USER_EMAIL)
        page.fill("#password", USER_PASSWORD)
        with page.expect_response(lambda r: "callback/credentials" in r.url and r.status == 200, timeout=15000):
            page.click("button[type=submit]")
        page.wait_for_timeout(2000)
        page.goto(f"{URL}/")
        page.wait_for_load_state("networkidle")
        has_abmelden = page.locator("text=Abmelden").count() > 0
        if has_abmelden:
            print("   OK: User login succeeded (session cookie set)")
        else:
            print("   FAIL: User login - home page does not show Abmelden")

        # 2. Admin login (separate session)
        print("2. Testing admin login at /admin...")
        page.goto(f"{URL}/admin")
        page.wait_for_load_state("networkidle")
        pw_input = page.locator('input[placeholder="Passwort"]')
        if pw_input.count() == 0:
            print("   Admin already logged in or no password field")
        else:
            pw_input.fill(ADMIN_PASSWORD)
            page.click("button:has-text('Anmelden')")
            page.wait_for_load_state("networkidle")
            page.wait_for_timeout(1500)
        if page.locator("text=Falsches Passwort").count() > 0:
            print("   FAIL: Admin login - wrong password")
        elif page.locator("h1:has-text('Admin')").count() > 0 and page.locator("text=User").count() > 0:
            print("   OK: Admin login succeeded")
        else:
            print("   Admin page state:", page.url, "- check manually")

        browser.close()
        print("Done.")

if __name__ == "__main__":
    main()
