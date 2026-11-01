from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, ForeignKey, Numeric, Boolean
from sqlalchemy.orm import relationship
from database import Base
import enum
from datetime import datetime

class CurrencyEnum(str, enum.Enum):
    BYN = "BYN"
    USD = "USD"
    EUR = "EUR"
    RUB = "RUB"
    BTC = "BTC"
    ETH = "ETH"
    TON = "TON"

class OperationType(str, enum.Enum):
    income = "income"
    expense = "expense"
    transfer = "transfer"

class Account(Base):
    __tablename__ = "accounts"
    id = Column(Integer, primary_key=True, index=True)
    account_group = Column(String, nullable=True)
    name = Column(String, nullable=False)
    short_name = Column(String, nullable=True)
    full_name = Column(String, nullable=True)
    account_type = Column(String, nullable=True)
    currency = Column(String, nullable=False)
    balance = Column(Numeric, nullable=False, default=0)
    initial_balance = Column(Numeric, nullable=False, default=0)
    goal_target = Column(Numeric, nullable=True)
    goal_deadline = Column(DateTime, nullable=True)
    icon = Column(String, nullable=True)
    color = Column(String, nullable=True)
    is_hidden = Column(Boolean, default=False)
    is_archived = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    sort_order = Column(Integer, nullable=True)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
    fiat_rate = Column(Numeric, nullable=True)
    crypto_assets = relationship("CryptoAsset", backref="account", cascade="all, delete-orphan")

class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)
    parent_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    color = Column(String, nullable=True)
    icon = Column(String, nullable=True)
    sort_order = Column(Integer, default=0)
    is_hidden = Column(Boolean, default=False)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
    parent = relationship("Category", remote_side=[id], backref="children")

class Operation(Base):
    __tablename__ = "operations"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)

    type = Column(String, nullable=False)   # в БД хранится как TEXT, не ENUM
    amount = Column(Numeric, nullable=False)
    currency = Column(String, nullable=False)  # тоже TEXT, не ENUM

    date_time = Column(DateTime(timezone=True), nullable=False)

    merchant = Column(String, nullable=True)
    place = Column(String, nullable=True)
    recipient = Column(String, nullable=True)
    note = Column(Text, nullable=True)
    photo_url = Column(String, nullable=True)

    is_pinned = Column(Boolean, default=False)

    created_at = Column(DateTime, nullable=False)
    updated_at = Column(DateTime, nullable=False)

class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    color = Column(String, nullable=True)
    icon = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class OperationTag(Base):
    __tablename__ = "operation_tags"

    operation_id = Column(
        Integer, ForeignKey("operations.id", ondelete="CASCADE"), primary_key=True
    )
    tag_id = Column(
        Integer, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True
    )

Operation.tags = relationship(
    "Tag",
    secondary="operation_tags",
    backref="operations"
)
