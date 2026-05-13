"""Python API smoke / E2E against the cosmetic backend."""

from __future__ import annotations

import os

import httpx
import pytest

# Valid 24-hex ObjectId shape (not required to exist)
_SAMPLE_ORDER_ID = "507f1f77bcf86cd799439011"


def test_health_ok(client: httpx.Client):
    r = client.get("/health")
    assert r.status_code == 200
    data = r.json()
    assert data.get("status") == "ok"


def test_invoice_json_without_token_is_unauthorized(client: httpx.Client):
    r = client.get(f"/orders/{_SAMPLE_ORDER_ID}/invoice")
    assert r.status_code == 401
    body = r.json()
    assert body.get("success") is False
    assert "token" in (body.get("message") or "").lower()


def test_invoice_with_bad_token_rejected(client: httpx.Client):
    r = client.get(
        f"/orders/{_SAMPLE_ORDER_ID}/invoice",
        headers={"Authorization": "Bearer not-a-real-jwt"},
    )
    assert r.status_code == 401
    assert r.json().get("success") is False


def test_orders_my_orders_requires_auth(client: httpx.Client):
    r = client.get("/orders/my-orders")
    assert r.status_code == 401


@pytest.mark.skipif(
    not os.environ.get("E2E_EMAIL") or not os.environ.get("E2E_PASSWORD"),
    reason="Set E2E_EMAIL and E2E_PASSWORD to run authenticated API E2E",
)
def test_login_me_and_optional_invoice(client: httpx.Client):
    email = os.environ["E2E_EMAIL"]
    password = os.environ["E2E_PASSWORD"]

    login = client.post("/auth/login", json={"email": email, "password": password})
    assert login.status_code == 200, login.text
    payload = login.json()
    assert payload.get("success") is not False
    token = payload.get("accessToken")
    assert isinstance(token, str) and len(token) > 20

    headers = {"Authorization": f"Bearer {token}"}

    me = client.get("/auth/me", headers=headers)
    assert me.status_code == 200, me.text
    user = me.json().get("user") or {}
    assert user.get("email", "").lower() == email.lower()

    orders_r = client.get("/orders/my-orders", headers=headers)
    assert orders_r.status_code == 200, orders_r.text
    orders_body = orders_r.json()
    orders = orders_body.get("orders") or []

    paid = [o for o in orders if o.get("isPaid")]
    if not paid:
        pytest.skip("No paid orders on this account; invoice E2E skipped")

    oid = paid[0].get("_id")
    assert oid

    inv = client.get(f"/orders/{oid}/invoice", headers=headers)
    assert inv.status_code == 200, inv.text
    data = inv.json()
    assert data.get("success") is True
    assert data.get("invoiceNumber")
    assert data.get("siteName")
    assert data.get("customer")
    order = data.get("order") or {}
    assert order.get("_id")
    assert order.get("orderItems")
