from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Operation, Category, Account, Tag, OperationTag
from typing import List, Dict
from decimal import Decimal
from datetime import datetime

router = APIRouter(prefix="/operations", tags=["Operations"])

# Helper: format one operation for frontend
def serialize_operation(op: Operation, db: Session):
    category = db.query(Category).filter(Category.id == op.category_id).first()
    category_data = None
    if category:
        category_data = {
            "id": category.id,
            "name": category.name,
            "icon": category.icon,
            "color": category.color,
        }
    tags_data = []
    if op.tags:
        tags_data = [
            {"id": t.id, "name": t.name, "color": t.color, "icon": t.icon}
            for t in op.tags
        ]

    return {
        "id": op.id,
        "account_id": op.account_id,
        "category": category_data,
        "type": op.type,
        "amount": float(op.amount),
        "currency": op.currency,
        "merchant": op.merchant,
        "place": op.place,
        "recipient": op.recipient,
        "note": op.note,
        "photo_url": op.photo_url,
        "is_pinned": op.is_pinned,
        "tags": tags_data,
        "date_time": op.date_time.isoformat() if op.date_time else None,
        "created_at": op.created_at.isoformat() if op.created_at else None,
        "updated_at": op.updated_at.isoformat() if op.updated_at else None,
    }

# GET /operations - return all operations ordered by date desc
@router.get("/")
def get_operations(db: Session = Depends(get_db)):
    ops = db.query(Operation).order_by(Operation.date_time.desc()).all()
    return [serialize_operation(op, db) for op in ops]

# GET /operations/sections — grouped by date for frontend
@router.get("/sections")
def get_sections(db: Session = Depends(get_db)):
    ops = db.query(Operation).order_by(Operation.date_time.desc()).all()

    sections: Dict[str, Dict] = {}

    for op in ops:
        if not op.date_time:
            continue

        date_key = op.date_time.strftime("%Y-%m-%d")

        if date_key not in sections:
            sections[date_key] = {
                "id": date_key,
                "dateLabel": op.date_time.strftime("%d %B %Y"),
                "items": [],
            }

        sections[date_key]["items"].append(serialize_operation(op, db))

    # convert dict → list sorted by date desc
    sorted_sections = sorted(sections.values(), key=lambda s: s["id"], reverse=True)
    return sorted_sections

# POST /operations - create new operation
@router.post("/")
def create_operation(data: dict, db: Session = Depends(get_db)):
    try:
        # Нормализуем сумму в Decimal, чтобы не складывать Decimal и float
        try:
            amount_value = Decimal(str(data.get("amount") or 0))
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid amount")

        raw_tags = data.get("tag_ids") or data.get("tags") or []
        tag_ids: List[int] = []
        if isinstance(raw_tags, list):
            for t in raw_tags:
                if isinstance(t, dict) and "id" in t:
                    tag_ids.append(int(t["id"]))
                elif isinstance(t, int):
                    tag_ids.append(t)
                else:
                    try:
                        tag_ids.append(int(t))
                    except Exception:
                        continue
        tag_ids = list({tid for tid in tag_ids if tid is not None})

        op = Operation(
            account_id=data.get("account_id"),
            category_id=data.get("category_id"),
            type=data.get("type"),
            amount=amount_value,
            currency=data.get("currency"),
            merchant=data.get("merchant"),
            place=data.get("place"),
            recipient=data.get("recipient"),
            note=data.get("note"),
            photo_url=data.get("photo_url"),
            is_pinned=data.get("is_pinned", False),
            date_time=datetime.fromisoformat(data.get("date_time")),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db.add(op)
        db.flush()  # получить op.id для связей

        # Свяжем метки через operation_tags
        if tag_ids:
            tags = db.query(Tag).filter(Tag.id.in_(tag_ids)).all()
            op.tags = tags

        account = db.query(Account).filter(Account.id == op.account_id).first()
        if not account:
            raise HTTPException(status_code=404, detail="Account not found")

        account.balance = Decimal(str(account.balance or 0))
        if op.type == "income":
            account.balance = account.balance + amount_value
        elif op.type == "expense":
            account.balance = account.balance - amount_value

        db.commit()
        db.refresh(op)

        return serialize_operation(op, db)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{operation_id}")
def update_operation(operation_id: int, data: dict, db: Session = Depends(get_db)):
    op = db.query(Operation).filter(Operation.id == operation_id).first()
    if not op:
        raise HTTPException(status_code=404, detail="Operation not found")

    raw_tags = data.get("tag_ids") or data.get("tags") or []
    tag_ids: List[int] = []
    if isinstance(raw_tags, list):
        for t in raw_tags:
            if isinstance(t, dict) and "id" in t:
                tag_ids.append(int(t["id"]))
            elif isinstance(t, int):
                tag_ids.append(t)
            else:
                try:
                    tag_ids.append(int(t))
                except Exception:
                    continue
    tag_ids = list({tid for tid in tag_ids if tid is not None})

    # Сохраняем старые значения для корректировки баланса
    old_account_id = op.account_id
    old_type = op.type
    old_amount = float(op.amount)

    try:
        op.account_id = data.get("account_id", op.account_id)
        op.category_id = data.get("category_id", op.category_id)
        op.type = data.get("type", op.type)
        new_amount = data.get("amount", op.amount)
        op.amount = Decimal(str(new_amount)) if new_amount is not None else op.amount
        op.currency = data.get("currency", op.currency)
        op.merchant = data.get("merchant", op.merchant)
        op.place = data.get("place", op.place)
        op.recipient = data.get("recipient", op.recipient)
        op.note = data.get("note", op.note)
        op.photo_url = data.get("photo_url", op.photo_url)
        op.is_pinned = data.get("is_pinned", op.is_pinned)
        dt = data.get("date_time")
        if dt:
            op.date_time = datetime.fromisoformat(dt)
        op.updated_at = datetime.utcnow()

        # Обновляем метки
        if tag_ids:
            tags = db.query(Tag).filter(Tag.id.in_(tag_ids)).all()
            op.tags = tags
        else:
            op.tags = []

        # Корректируем балансы
        # 1) откатываем старое влияние
        if old_account_id:
            old_acc = db.query(Account).filter(Account.id == old_account_id).first()
            if old_acc:
                if old_type == "income":
                    old_acc.balance = Decimal(str(old_acc.balance)) - Decimal(str(old_amount))
                elif old_type == "expense":
                    old_acc.balance = Decimal(str(old_acc.balance)) + Decimal(str(old_amount))

        # 2) применяем новое влияние
        new_acc = db.query(Account).filter(Account.id == op.account_id).first()
        if not new_acc:
            raise HTTPException(status_code=404, detail="Account not found")
        if op.type == "income":
            new_acc.balance = Decimal(str(new_acc.balance)) + Decimal(str(op.amount))
        elif op.type == "expense":
            new_acc.balance = Decimal(str(new_acc.balance)) - Decimal(str(op.amount))

        db.commit()
        db.refresh(op)
        return serialize_operation(op, db)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

# DELETE /operations/{id}
@router.delete("/{operation_id}")
def delete_operation(operation_id: int, db: Session = Depends(get_db)):
    op = db.query(Operation).filter(Operation.id == operation_id).first()
    if not op:
        raise HTTPException(status_code=404, detail="Operation not found")

    account = db.query(Account).filter(Account.id == op.account_id).first()
    if account:
        if op.type == "income":
            account.balance = account.balance - op.amount
        elif op.type == "expense":
            account.balance = account.balance + op.amount

    # Delete tag links (many-to-many)
    db.query(OperationTag).filter(OperationTag.operation_id == operation_id).delete()

    db.delete(op)
    db.commit()
    return {"status": "deleted", "id": operation_id}
