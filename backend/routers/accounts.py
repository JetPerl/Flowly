from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Account
from typing import List, Dict

router = APIRouter(prefix="/accounts", tags=["Accounts"])

# Serialize one account
def serialize_account(acc: Account) -> Dict:
    return {
        "id": acc.id,
        "account_group": acc.account_group,
        "name": acc.name,
        "short_name": acc.short_name,
        "full_name": acc.full_name,
        "account_type": acc.account_type,
        "currency": acc.currency,
        "balance": float(acc.balance) if acc.balance is not None else 0.0,
        "initial_balance": float(acc.initial_balance) if acc.initial_balance is not None else 0.0,
        "goal_target": float(acc.goal_target) if acc.goal_target is not None else 0.0,
        "goal_deadline": acc.goal_deadline,
        "icon": acc.icon,
        "color": acc.color,
        "is_hidden": acc.is_hidden,
        "is_archived": acc.is_archived,
        "is_active": acc.is_active,
        "sort_order": acc.sort_order,
        "fiat_rate": float(acc.fiat_rate) if acc.fiat_rate is not None else 0.0,
    }

# GET /accounts → list all accounts
@router.get("/")
def get_accounts(db: Session = Depends(get_db)):
    accounts = db.query(Account).order_by(Account.sort_order, Account.id).all()
    return [serialize_account(acc) for acc in accounts]

# GET /accounts/{id}
@router.get("/{account_id}")
def get_account(account_id: int, db: Session = Depends(get_db)):
    acc = db.query(Account).filter(Account.id == account_id).first()
    if not acc:
        raise HTTPException(status_code=404, detail="Account not found")
    return serialize_account(acc)

# POST /accounts → create an account
@router.post("/")
def create_account(data: dict, db: Session = Depends(get_db)):
    acc = Account(
        account_group=data.get("account_group"),
        name=data.get("name"),
        short_name=data.get("short_name"),
        full_name=data.get("full_name"),
        account_type=data.get("account_type"),
        currency=data.get("currency"),
        balance=data.get("balance", 0),
        initial_balance=data.get("initial_balance", 0),
        goal_target=data.get("goal_target"),
        goal_deadline=data.get("goal_deadline"),
        icon=data.get("icon"),
        color=data.get("color"),
        is_hidden=data.get("is_hidden", False),
        is_archived=data.get("is_archived", False),
        is_active=data.get("is_active", True),
        sort_order=data.get("sort_order"),
        fiat_rate=data.get("fiat_rate"),
    )
    db.add(acc)
    db.commit()
    db.refresh(acc)
    return serialize_account(acc)

# DELETE /accounts/{id}
@router.delete("/{account_id}")
def delete_account(account_id: int, db: Session = Depends(get_db)):
    acc = db.query(Account).filter(Account.id == account_id).first()
    if not acc:
        raise HTTPException(status_code=404, detail="Account not found")
    db.delete(acc)
    db.commit()
    return {"status": "deleted", "id": account_id}
