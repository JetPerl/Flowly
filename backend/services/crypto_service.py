from sqlalchemy.orm import Session
from models_crypto import CryptoAsset
from models import Account
from typing import Dict, Optional
import requests
import asyncio
from database import SessionLocal


# -----------------------------
# Load real crypto prices (CoinGecko)
# -----------------------------
def fetch_price_from_api(symbol: str) -> Optional[float]:
    """
    Fetch crypto price using CoinGecko (stable, free, no API key required).
    """
    mapping = {
        "BTC": "bitcoin",
        "ETH": "ethereum",
        "TON": "the-open-network",
    }

    key = symbol.upper()
    if key not in mapping:
        return None

    url = f"https://api.coingecko.com/api/v3/simple/price?ids={mapping[key]}&vs_currencies=usd"

    try:
        res = requests.get(url, timeout=5)
        res.raise_for_status()
        data = res.json()
        return float(data[mapping[key]]["usd"])
    except Exception:
        return None


# -----------------------------
# Update prices for ALL assets
# -----------------------------
def update_all_crypto_prices(db: Session) -> Dict[str, float]:
    """
    Updates current_price for all CryptoAsset rows using CoinGecko API.
    Returns dict of updated prices.
    """
    assets = db.query(CryptoAsset).all()
    updated = {}

    for asset in assets:
        price = fetch_price_from_api(asset.symbol)
        if price is not None:
            amount = float(asset.amount or 0)

            asset.current_price = price
            asset.value = amount * price

            # Recalculate PnL
            if asset.avg_buy_price:
                avg = float(asset.avg_buy_price)
                asset.pnl = asset.value - (amount * avg)

                if amount > 0 and avg > 0:
                    asset.pnl_percent = (asset.pnl / (amount * avg)) * 100

            updated[asset.symbol] = price

    db.commit()
    return updated


# -----------------------------
# Recalculate balance of a crypto account
# -----------------------------
def update_crypto_account_balance(account_id: int, db: Session):
    """
    Recalculates and updates the balance of a crypto account.
    """
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        return

    assets = db.query(CryptoAsset).filter(CryptoAsset.account_id == account_id).all()

    total_value = 0
    for a in assets:
        if a.current_price is not None:
            total_value += float(a.amount or 0) * float(a.current_price)

    account.balance = total_value
    db.commit()


# -----------------------------
# Update balance of all crypto accounts
# -----------------------------
def update_all_crypto_account_balances(db: Session):
    crypto_accounts = db.query(Account).filter(Account.account_type == "crypto").all()

    for acc in crypto_accounts:
        update_crypto_account_balance(acc.id, db)


# -----------------------------
# Background auto-update loop
# -----------------------------
async def auto_update_crypto_loop(interval_seconds: int = 600):
    """
    Бесконечный цикл автообновления курсов и балансов криптосчётов.
    interval_seconds = 600 => каждые 10 минут.
    """
    while True:
        db = SessionLocal()
        try:
            update_all_crypto_prices(db)
            update_all_crypto_account_balances(db)
        finally:
            db.close()

        await asyncio.sleep(interval_seconds)