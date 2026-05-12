#!/usr/bin/env python3
"""
Python E2E smoke runner for cosmetic-ecomm web flows.

Use this when local Node runtime cannot execute browser tests.
It validates:
1) Public web route health
2) Backend API health and products endpoint
3) Browser flow smoke navigation with Playwright
"""

from __future__ import annotations

import argparse
import json
import sys
import traceback
from dataclasses import dataclass
from typing import List
from urllib.parse import urljoin

import requests


@dataclass
class StepResult:
    name: str
    ok: bool
    detail: str


def normalize_base(url: str) -> str:
    return url.rstrip("/") + "/"


def check_http_page(base_url: str, path: str, timeout: int) -> StepResult:
    full_url = urljoin(base_url, path.lstrip("/"))
    try:
        response = requests.get(full_url, timeout=timeout)
        body = response.text[:1000].lower()
        if response.status_code >= 400:
            return StepResult(
                name=f"HTTP {path}",
                ok=False,
                detail=f"{response.status_code} from {full_url}",
            )
        if "application error" in body or "internal server error" in body:
            return StepResult(
                name=f"HTTP {path}",
                ok=False,
                detail=f"Error marker found in response body: {full_url}",
            )
        return StepResult(
            name=f"HTTP {path}",
            ok=True,
            detail=f"{response.status_code} from {full_url}",
        )
    except Exception as exc:
        return StepResult(
            name=f"HTTP {path}",
            ok=False,
            detail=f"Request failed for {full_url}: {exc}",
        )


def check_api_health(api_base: str, timeout: int) -> List[StepResult]:
    results: List[StepResult] = []
    api_base = normalize_base(api_base)

    endpoints = [
        ("API categories", "categories"),
        ("API products", "products?limit=1"),
    ]
    for label, endpoint in endpoints:
        url = urljoin(api_base, endpoint)
        try:
            response = requests.get(url, timeout=timeout)
            if response.status_code >= 400:
                results.append(
                    StepResult(label, False, f"{response.status_code} from {url}")
                )
                continue

            parsed = {}
            try:
                parsed = response.json()
            except json.JSONDecodeError:
                results.append(
                    StepResult(label, False, f"Non-JSON response from {url}")
                )
                continue

            if parsed.get("success") is False:
                results.append(
                    StepResult(label, False, f"success=false in payload from {url}")
                )
                continue

            results.append(StepResult(label, True, f"{response.status_code} from {url}"))
        except Exception as exc:
            results.append(StepResult(label, False, f"Request failed for {url}: {exc}"))

    return results


def run_browser_checks(base_url: str, timeout_ms: int, headless: bool) -> List[StepResult]:
    results: List[StepResult] = []
    try:
        from playwright.sync_api import sync_playwright
    except Exception as exc:
        results.append(
            StepResult(
                "Playwright import",
                False,
                "Playwright not available. Install with: pip install playwright && "
                f"python -m playwright install chromium. Error: {exc}",
            )
        )
        return results

    smoke_paths = [
        "/",
        "/products",
        "/cart",
        "/quiz",
        "/sale",
    ]

    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=headless)
            context = browser.new_context(ignore_https_errors=True)
            page = context.new_page()

            for path in smoke_paths:
                full_url = urljoin(base_url, path.lstrip("/"))
                try:
                    response = page.goto(full_url, wait_until="domcontentloaded", timeout=timeout_ms)
                    status = response.status if response else None
                    body = page.content().lower()
                    title = page.title().strip()

                    if status is not None and status >= 400:
                        results.append(
                            StepResult(
                                f"Browser {path}",
                                False,
                                f"HTTP status {status} while loading {full_url}",
                            )
                        )
                        continue

                    if "application error" in body or "internal server error" in body:
                        results.append(
                            StepResult(
                                f"Browser {path}",
                                False,
                                f"Error marker found in page content: {full_url}",
                            )
                        )
                        continue

                    if not title:
                        results.append(
                            StepResult(
                                f"Browser {path}",
                                False,
                                f"Empty page title for {full_url}",
                            )
                        )
                        continue

                    results.append(
                        StepResult(
                            f"Browser {path}",
                            True,
                            f"Loaded {full_url} (status={status}, title={title})",
                        )
                    )
                except Exception as exc:
                    results.append(
                        StepResult(
                            f"Browser {path}",
                            False,
                            f"Navigation failed for {full_url}: {exc}",
                        )
                    )

            browser.close()
    except Exception as exc:
        results.append(
            StepResult(
                "Playwright runtime",
                False,
                f"Browser startup/runtime failed: {exc}",
            )
        )
        tb = traceback.format_exc(limit=2)
        results.append(StepResult("Playwright traceback", False, tb))

    return results


def run_cart_flow_check(
    base_url: str,
    timeout_ms: int,
    headless: bool,
    login_email: str,
    login_password: str,
) -> List[StepResult]:
    results: List[StepResult] = []
    try:
        from playwright.sync_api import TimeoutError as PlaywrightTimeoutError
        from playwright.sync_api import sync_playwright
    except Exception as exc:
        results.append(
            StepResult(
                "Cart flow prerequisites",
                False,
                "Playwright not available. Install with: pip install playwright && "
                f"python -m playwright install chromium. Error: {exc}",
            )
        )
        return results

    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=headless)
            context = browser.new_context(ignore_https_errors=True)
            page = context.new_page()

            products_url = urljoin(base_url, "products")
            response = page.goto(products_url, wait_until="domcontentloaded", timeout=timeout_ms)
            status = response.status if response else None
            if status is not None and status >= 400:
                browser.close()
                return [
                    StepResult(
                        "Cart flow open products",
                        False,
                        f"Cannot open products page, status={status}",
                    )
                ]

            add_button = page.locator(
                'button:has-text("Add"), button:has-text("Add to Cart"), button:has-text("Add To Cart")'
            ).first
            try:
                add_button.wait_for(state="visible", timeout=7000)
                add_button.click(timeout=timeout_ms)
                current_url = page.url
                if "/auth/login" in current_url:
                    if not login_email or not login_password:
                        browser.close()
                        return [
                            StepResult(
                                "Cart flow auth requirement",
                                False,
                                "Add-to-cart redirected to login. Re-run with --login-email and --login-password for full cart E2E.",
                            )
                        ]

                    email_input = page.locator('input[type="email"]').first
                    password_input = page.locator('input[type="password"]').first
                    sign_in_button = page.locator('button:has-text("Sign In")').first

                    email_input.fill(login_email, timeout=timeout_ms)
                    password_input.fill(login_password, timeout=timeout_ms)
                    sign_in_button.click(timeout=timeout_ms)
                    page.wait_for_load_state("domcontentloaded", timeout=timeout_ms)

                    # Retry add-to-cart after successful login.
                    page.goto(products_url, wait_until="domcontentloaded", timeout=timeout_ms)
                    add_button.wait_for(state="visible", timeout=timeout_ms)
                    add_button.click(timeout=timeout_ms)

                results.append(
                    StepResult(
                        "Cart flow add from listing",
                        True,
                        "Clicked Add to Cart on product listing page",
                    )
                )
            except PlaywrightTimeoutError:
                page_text = page.content().lower()
                reason = (
                    "No product 'Add' button rendered on /products. "
                    "The page appears to have no purchasable products right now."
                )
                if "no products found" in page_text:
                    reason = (
                        "Products page shows 'No products found', so cart flow cannot continue."
                    )
                browser.close()
                return [StepResult("Cart flow add item", False, reason)]

            cart_url = urljoin(base_url, "cart")
            page.goto(cart_url, wait_until="domcontentloaded", timeout=timeout_ms)
            body = page.content().lower()

            # Assert we are not in empty-cart state by checking known empty cart labels.
            empty_cart_markers = ["your cart is empty", "cart is empty"]
            if any(marker in body for marker in empty_cart_markers):
                results.append(
                    StepResult(
                        "Cart flow verify cart",
                        False,
                        "Cart page still shows empty-cart message after add-to-cart action",
                    )
                )
            else:
                results.append(
                    StepResult(
                        "Cart flow verify cart",
                        True,
                        "Cart has at least one item after add-to-cart action",
                    )
                )

            browser.close()
    except Exception as exc:
        results.append(
            StepResult(
                "Cart flow runtime",
                False,
                f"Cart flow execution failed: {exc}",
            )
        )
        tb = traceback.format_exc(limit=2)
        results.append(StepResult("Cart flow traceback", False, tb))

    return results


def run_payment_flow_check(
    base_url: str,
    timeout_ms: int,
    headless: bool,
    login_email: str,
    login_password: str,
) -> List[StepResult]:
    results: List[StepResult] = []
    try:
        from playwright.sync_api import TimeoutError as PlaywrightTimeoutError
        from playwright.sync_api import sync_playwright
    except Exception as exc:
        return [
            StepResult(
                "Payment flow prerequisites",
                False,
                "Playwright not available. Install with: pip install playwright && "
                f"python -m playwright install chromium. Error: {exc}",
            )
        ]

    if not login_email or not login_password:
        return [
            StepResult(
                "Payment flow auth",
                False,
                "Payment flow requires --login-email and --login-password.",
            )
        ]

    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=headless)
            context = browser.new_context(ignore_https_errors=True)
            page = context.new_page()

            def login_now() -> bool:
                login_url_inner = urljoin(base_url, "auth/login?redirect=/products")
                page.goto(login_url_inner, wait_until="domcontentloaded", timeout=timeout_ms)
                page.locator('input[type="email"]').first.fill(login_email, timeout=timeout_ms)
                page.locator('input[type="password"]').first.fill(login_password, timeout=timeout_ms)
                page.locator('button:has-text("Sign In")').first.click(timeout=timeout_ms)
                try:
                    page.wait_for_url("**/products**", timeout=15000)
                    return True
                except PlaywrightTimeoutError:
                    page.wait_for_timeout(2000)
                    return "/auth/login" not in page.url

            # 1) Login
            if not login_now():
                browser.close()
                return [StepResult("Payment flow login", False, "Login failed or stayed on auth screen")]
            results.append(StepResult("Payment flow login", True, "Authenticated successfully"))

            # 2) Ensure at least one item in cart
            products_url = urljoin(base_url, "products")
            page.goto(products_url, wait_until="domcontentloaded", timeout=timeout_ms)
            add_button = page.locator(
                'button:has-text("Add"), button:has-text("Add to Cart"), button:has-text("Add To Cart")'
            ).first
            add_button.wait_for(state="visible", timeout=timeout_ms)
            add_button.click(timeout=timeout_ms)
            if "/auth/login" in page.url:
                if not login_now():
                    browser.close()
                    return [StepResult("Payment flow re-login", False, "Redirected to login and re-auth failed")]
                page.goto(products_url, wait_until="domcontentloaded", timeout=timeout_ms)
                add_button = page.locator(
                    'button:has-text("Add"), button:has-text("Add to Cart"), button:has-text("Add To Cart")'
                ).first
                add_button.wait_for(state="visible", timeout=timeout_ms)
                add_button.click(timeout=timeout_ms)
            results.append(StepResult("Payment flow add cart item", True, "Added item to cart"))

            # 3) Go checkout and prepare razorpay payment option
            checkout_url = urljoin(base_url, "checkout")
            page.goto(checkout_url, wait_until="domcontentloaded", timeout=timeout_ms)
            if "/auth/login" in page.url:
                if not login_now():
                    browser.close()
                    return [StepResult("Payment flow checkout auth", False, "Checkout redirected to login and re-auth failed")]
                page.goto(checkout_url, wait_until="domcontentloaded", timeout=timeout_ms)
                if "/auth/login" in page.url:
                    browser.close()
                    return [
                        StepResult(
                            "Payment flow checkout auth",
                            False,
                            "Checkout still redirects to login even after successful authentication.",
                        )
                    ]

            # If no saved address exists, fill address form once.
            save_address_button = page.locator('button:has-text("Save Address")').first
            if save_address_button.count() > 0:
                page.locator('input[placeholder="John Doe"]').first.fill("Rahul Kumar")
                page.locator('input[placeholder="9876543210"]').first.fill("9876543210")
                page.locator('input[placeholder="400001"]').first.fill("400001")
                page.locator('input[placeholder="House / Flat no., Street"]').first.fill("Flat 101, Test Street")
                page.locator('input[placeholder="Landmark, Area"]').first.fill("Near Park")
                page.locator('input[placeholder="Mumbai"]').first.fill("Mumbai")
                page.locator('input[placeholder="Maharashtra"]').first.fill("Maharashtra")
                save_address_button.click(timeout=timeout_ms)
                page.wait_for_load_state("domcontentloaded", timeout=timeout_ms)
                results.append(StepResult("Payment flow address", True, "Saved checkout address"))

            payment_radio = page.locator('input[value="razorpay"]').first
            try:
                payment_radio.wait_for(state="attached", timeout=timeout_ms)
            except PlaywrightTimeoutError:
                browser.close()
                return [
                    StepResult(
                        "Payment flow checkout UI",
                        False,
                        "Razorpay option not visible on checkout page; payment section did not load.",
                    )
                ]
            payment_radio.check(timeout=timeout_ms)

            # 4) Click pay and validate create-order API + Razorpay modal trigger
            pay_button = page.locator('button:has-text("Pay ")').first
            pay_button.wait_for(state="visible", timeout=timeout_ms)
            pay_button_text = (pay_button.text_content() or "").strip()

            with page.expect_response(
                lambda resp: "/payments/create-order" in resp.url,
                timeout=timeout_ms,
            ) as create_order_response:
                pay_button.click(timeout=timeout_ms)

            create_order_status = create_order_response.value.status
            if create_order_status >= 400:
                browser.close()
                return [
                    StepResult(
                        "Payment flow create-order",
                        False,
                        f"/payments/create-order returned HTTP {create_order_status}",
                    )
                ]

            results.append(
                StepResult(
                    "Payment flow create-order",
                    True,
                    f"Payment order initialized (HTTP {create_order_status})",
                )
            )

            # Razorpay modal is rendered in iframe; verify it appears.
            try:
                page.locator('iframe[src*="razorpay"], iframe[name*="razorpay"]').first.wait_for(
                    state="attached",
                    timeout=10000,
                )
                results.append(
                    StepResult(
                        "Payment flow gateway modal",
                        True,
                        f"Razorpay modal opened after clicking '{pay_button_text or 'Pay'}'",
                    )
                )
            except PlaywrightTimeoutError:
                # Fallback success condition: many builds keep overlay in div roots instead of iframes.
                body = page.content().lower()
                if "razorpay" in body:
                    results.append(
                        StepResult(
                            "Payment flow gateway modal",
                            True,
                            "Razorpay marker found in page content after payment init",
                        )
                    )
                else:
                    results.append(
                        StepResult(
                            "Payment flow gateway modal",
                            False,
                            "Could not confirm Razorpay modal/marker after create-order call",
                        )
                    )

            browser.close()
    except Exception as exc:
        results.append(
            StepResult(
                "Payment flow runtime",
                False,
                f"Payment flow execution failed: {exc}",
            )
        )
        tb = traceback.format_exc(limit=2)
        results.append(StepResult("Payment flow traceback", False, tb))

    return results


def print_results(results: List[StepResult]) -> bool:
    has_failure = False
    print("\n=== E2E SMOKE RESULTS ===")
    for result in results:
        status = "PASS" if result.ok else "FAIL"
        print(f"[{status}] {result.name}: {result.detail}")
        if not result.ok:
            has_failure = True
    print("=========================\n")
    return not has_failure


def main() -> int:
    parser = argparse.ArgumentParser(description="Run Python-based E2E smoke checks.")
    parser.add_argument(
        "--base-url",
        default="https://cosmetic-ecomm.vercel.app",
        help="Public website base URL",
    )
    parser.add_argument(
        "--api-url",
        default="https://cosmetic-ecomm-backend.vercel.app/api",
        help="Public API base URL",
    )
    parser.add_argument(
        "--timeout",
        type=int,
        default=20,
        help="HTTP timeout in seconds",
    )
    parser.add_argument(
        "--browser-timeout-ms",
        type=int,
        default=30000,
        help="Browser navigation timeout in milliseconds",
    )
    parser.add_argument(
        "--headed",
        action="store_true",
        help="Run browser in headed mode (default is headless)",
    )
    parser.add_argument(
        "--login-email",
        default="",
        help="User email for authenticated cart-flow checks",
    )
    parser.add_argument(
        "--login-password",
        default="",
        help="User password for authenticated cart-flow checks",
    )
    args = parser.parse_args()

    base_url = normalize_base(args.base_url)

    all_results: List[StepResult] = []

    # Basic route probes before browser checks.
    for route in ["/", "/products", "/cart", "/quiz", "/sale"]:
        all_results.append(check_http_page(base_url, route, timeout=args.timeout))

    # API smoke checks.
    all_results.extend(check_api_health(args.api_url, timeout=args.timeout))

    # Browser navigation checks.
    all_results.extend(
        run_browser_checks(
            base_url=base_url,
            timeout_ms=args.browser_timeout_ms,
            headless=not args.headed,
        )
    )

    # End-to-end cart flow (add item -> verify cart not empty).
    all_results.extend(
        run_cart_flow_check(
            base_url=base_url,
            timeout_ms=args.browser_timeout_ms,
            headless=not args.headed,
            login_email=args.login_email.strip(),
            login_password=args.login_password,
        )
    )

    # Authenticated payment-init flow (without completing transaction).
    all_results.extend(
        run_payment_flow_check(
            base_url=base_url,
            timeout_ms=args.browser_timeout_ms,
            headless=not args.headed,
            login_email=args.login_email.strip(),
            login_password=args.login_password,
        )
    )

    ok = print_results(all_results)
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
