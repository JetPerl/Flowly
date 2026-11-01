import os
from typing import Any, Dict, List, Optional

import requests
from fastapi import APIRouter, Body, HTTPException

router = APIRouter(tags=["SaltEdge"])

API_BASE = os.getenv("SALTEDGE_API_BASE", "https://www.saltedge.com/api/v5")
APP_ID = os.getenv("SALTEDGE_APP_ID")
SECRET = os.getenv("SALTEDGE_SECRET")
DEFAULT_CUSTOMER_ID = os.getenv("SALTEDGE_CUSTOMER_ID", "flowly-demo-customer")
DEFAULT_RETURN_TO = os.getenv("SALTEDGE_RETURN_TO", "https://flowly.app/connect-return")
DEFAULT_LOCALE = os.getenv("SALTEDGE_LOCALE", "ru")
INCLUDE_FAKE_PROVIDERS = os.getenv("SALTEDGE_INCLUDE_FAKE_PROVIDERS", "").lower() in ("1", "true", "yes")


def _salt_headers() -> Dict[str, str]:
    return {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "App-id": APP_ID or "",
        "Secret": SECRET or "",
    }


def _ensure_creds():
    if not APP_ID or not SECRET:
        raise HTTPException(
            status_code=500, detail="Salt Edge credentials are not configured (SALTEDGE_APP_ID/SECRET)"
        )


def _ensure_customer(customer_id: str):
    res = requests.post(
        f"{API_BASE}/customers",
        json={"data": {"identifier": customer_id}},
        headers=_salt_headers(),
        timeout=10,
    )
    if res.status_code == 409:
        return
    if not res.ok:
        raise HTTPException(status_code=502, detail=f"Create customer failed: {res.text}")


def _create_connect_session(
    customer_id: str,
    return_to: str,
    scopes: List[str],
    locale: str,
    include_fake_providers: bool,
) -> str:
    payload: Dict[str, Any] = {
        "data": {
            "customer_id": customer_id,
            "consent": {"scopes": scopes},
            "attempt": {"return_to": return_to},
            "locale": locale,
            "include_fake_providers": include_fake_providers,
        }
    }
    res = requests.post(
        f"{API_BASE}/connect_sessions/create",
        json=payload,
        headers=_salt_headers(),
        timeout=15,
    )
    try:
        body = res.json()
    except Exception:
        body = None

    if not res.ok:
        message = None
        if isinstance(body, dict):
            message = body.get("error", {}).get("message") or body.get("message")
        raise HTTPException(status_code=502, detail=message or f"Connect session failed ({res.status_code})")

    connect_url: Optional[str] = None
    if isinstance(body, dict):
        connect_url = body.get("data", {}).get("connect_url")
    if not connect_url:
        raise HTTPException(status_code=500, detail="connect_url is missing in Salt Edge response")
    return connect_url


def _connect_session(body: Dict[str, Any]) -> Dict[str, str]:
    _ensure_creds()

    customer_id = str(body.get("customer_id") or DEFAULT_CUSTOMER_ID)
    return_to = str(body.get("return_to") or DEFAULT_RETURN_TO)
    scopes_raw = body.get("scopes")
    scopes = (
        [str(s) for s in scopes_raw if isinstance(s, (str, int))]
        if isinstance(scopes_raw, list)
        else ["account_details", "transactions_details"]
    )
    locale = str(body.get("locale") or body.get("language_code") or DEFAULT_LOCALE)
    include_fake = bool(body.get("include_fake_providers", INCLUDE_FAKE_PROVIDERS))

    _ensure_customer(customer_id)
    connect_url = _create_connect_session(
        customer_id=customer_id,
        return_to=return_to,
        scopes=scopes,
        locale=locale,
        include_fake_providers=include_fake,
    )
    return {"connect_url": connect_url}


@router.post("/connect-session")
def connect_session(body: Dict[str, Any] = Body(default_factory=dict)):
    return _connect_session(body)


@router.post("/api/connect-session")
def connect_session_api(body: Dict[str, Any] = Body(default_factory=dict)):
    return _connect_session(body)
