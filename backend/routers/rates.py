from fastapi import APIRouter, HTTPException
import time
import requests
from typing import Dict

router = APIRouter(prefix="/rates", tags=["Rates"])

# --- Cache container ---
CACHE_RATES = {"data": None, "timestamp": 0}
CACHE_TTL = 300  # 5 minutes

# --- Fetch fiat currency rates ---
def fetch_fiat_rates() -> Dict[str, float]:
    """
    Загружаем официальные курсы с API НБРБ и пересчитываем их в «сколько BYN за единицу валюты».
    """
    fallback = {
        "BYN": 1.0,
        "USD": 3.25,
        "EUR": 3.45,
        "RUB": 0.034,
    }

    try:
        url = "https://api.nbrb.by/exrates/rates?periodicity=0"
        r = requests.get(url, timeout=6)
        r.raise_for_status()
        data = r.json() or []

        def to_number(val):
            try:
                num = float(val)
                return num if num > 0 else None
            except Exception:
                return None

        result = {"BYN": 1.0}
        items = data if isinstance(data, list) else []
        for item in items:
            code = str(item.get("Cur_Abbreviation") or "").upper()
            rate = to_number(item.get("Cur_OfficialRate"))
            scale = to_number(item.get("Cur_Scale")) or 1
            if not code or rate is None:
                continue
            result[code] = rate / scale

        # Подстрахуемся, чтобы ключевые валюты всегда присутствовали.
        for code, val in fallback.items():
            result.setdefault(code, val)

        return result
    except Exception:
        return fallback

# --- Fetch crypto prices from Binance ---
def fetch_crypto_rates(usd_to_byn: float) -> Dict[str, float]:
    crypto = {}
    try:
        pairs = {
            "BTC": "BTCUSDT",
            "ETH": "ETHUSDT",
            "TON": "TONUSDT",
        }
        for symbol, pair in pairs.items():
            r = requests.get(f"https://api.binance.com/api/v3/ticker/price?symbol={pair}")
            price_usd = float(r.json()["price"])
            crypto[symbol] = price_usd * usd_to_byn
    except Exception:
        crypto = {"BTC": 0.0, "ETH": 0.0, "TON": 0.0}
    return crypto

# --- Main rates endpoint ---
@router.get("/")
def get_rates():
    now = time.time()

    # return cached rates
    if CACHE_RATES["data"] and (now - CACHE_RATES["timestamp"]) < CACHE_TTL:
        return CACHE_RATES["data"]

    fiat = fetch_fiat_rates()
    raw_usd = fiat.get("USD", 1.0)
    usd_to_byn = raw_usd if isinstance(raw_usd, (int, float)) else 1.0
    crypto = fetch_crypto_rates(usd_to_byn)

    final = {**fiat, **crypto}

    CACHE_RATES["data"] = final
    CACHE_RATES["timestamp"] = now

    return final
