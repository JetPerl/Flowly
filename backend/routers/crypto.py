

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models_crypto import CryptoAsset
from models import Account
from typing import List

router = APIRouter(
    prefix="/crypto",
    tags=["crypto"]
)

def serialize_asset(asset: CryptoAsset):
    return {
        "id": asset.id,
        "account_id": asset.account_id,
        "symbol": asset.symbol,
        "name": asset.name,
        "icon": asset.icon,
        "amount": float(asset.amount or 0),
        "avg_buy_price": float(asset.avg_buy_price or 0),
        "current_price": float(asset.current_price or 0),
        "value": float(asset.value or 0),
        "pnl": float(asset.pnl or 0),
        "pnl_percent": float(asset.pnl_percent or 0),
        "currency": asset.currency,
        "created_at": asset.created_at,
        "updated_at": asset.updated_at,
    }

# -------------------------
# GET /crypto/accounts
# Returns list of all crypto accounts with aggregated portfolio
# -------------------------
@router.get("/accounts")
def get_crypto_accounts(db: Session = Depends(get_db)):
    accounts = db.query(Account).filter(Account.account_type == "crypto").all()

    result = []
    for acc in accounts:
        assets = db.query(CryptoAsset).filter(CryptoAsset.account_id == acc.id).all()
        total_value = sum(float(a.value or 0) for a in assets)

        result.append({
            "id": acc.id,
            "name": acc.name,
            "currency": acc.currency,
            "balance": total_value,
            "assets": [serialize_asset(a) for a in assets]
        })

    return result

# -------------------------
# GET /crypto/accounts/{account_id}
# Full portfolio for a single crypto account
# -------------------------
@router.get("/accounts/{account_id}")
def get_crypto_account(account_id: int, db: Session = Depends(get_db)):
    account = db.query(Account).filter(Account.id == account_id, Account.account_type == "crypto").first()
    if not account:
        raise HTTPException(status_code=404, detail="Crypto account not found")

    assets = db.query(CryptoAsset).filter(CryptoAsset.account_id == account_id).all()
    total_value = sum(float(a.value or 0) for a in assets)

    return {
        "id": account_id,
        "name": account.name,
        "currency": account.currency,
        "balance": total_value,
        "assets": [serialize_asset(a) for a in assets]
    }

# -------------------------
# GET /crypto/assets/{asset_id}
# Returns a single asset
# -------------------------
@router.get("/assets/{asset_id}")
def get_crypto_asset(asset_id: int, db: Session = Depends(get_db)):
    asset = db.query(CryptoAsset).filter(CryptoAsset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Crypto asset not found")
    return serialize_asset(asset)

# -------------------------
# POST /crypto/assets/update-price
# Update price for a token manually (for debugging)
# -------------------------
@router.post("/assets/{asset_id}/update-price")
def update_crypto_asset_price(asset_id: int, price: float, db: Session = Depends(get_db)):
    asset = db.query(CryptoAsset).filter(CryptoAsset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Crypto asset not found")

    asset.current_price = price
    asset.value = float(asset.amount or 0) * float(price)

    # Recalculate PnL
    if asset.avg_buy_price:
        avg = float(asset.avg_buy_price)
        asset.pnl = asset.value - (float(asset.amount or 0) * avg)
        if asset.amount > 0:
            asset.pnl_percent = (asset.pnl / (asset.amount * avg)) * 100

    db.commit()
    db.refresh(asset)

    return serialize_asset(asset)