import os

import httpx
import pytest


@pytest.fixture(scope="session")
def api_base() -> str:
    """API root including `/api` (same contract as NEXT_PUBLIC_API_URL)."""
    raw = os.environ.get("E2E_API_BASE", "https://cosmetic-ecomm-backend.vercel.app/api")
    return raw.rstrip("/")


@pytest.fixture(scope="session")
def client(api_base: str):
    with httpx.Client(base_url=api_base, timeout=30.0) as c:
        yield c
