from datetime import datetime
from typing import Optional, List, Literal
from pydantic import BaseModel

# --- Account Schemas ---

class AccountBase(BaseModel):
    title: str
    currency: str
    icon: Optional[str] = None
    balance: float = 0
    account_type: Optional[str] = None
    order_index: Optional[int] = None
    is_hidden: bool = False

class AccountResponse(AccountBase):
    id: int
    class Config:
        from_attributes = True

# --- Category Schemas ---

class CategoryBase(BaseModel):
    name: str
    parent_id: Optional[int] = None
    type: str
    sort_order: int = 0
    color: Optional[str] = None

class CategoryResponse(CategoryBase):
    id: int
    class Config:
        from_attributes = True

class CategoryTreeChild(BaseModel):
    id: int
    name: str
    color: Optional[str] = None
    class Config:
        from_attributes = True

class CategoryTreeItem(BaseModel):
    id: int
    name: str
    color: Optional[str] = None
    children: List[CategoryTreeChild] = []
    class Config:
        from_attributes = True

# --- Operation Schemas ---

class OperationBase(BaseModel):
    account_id: int
    category_id: int
    type: Literal["income", "expense", "transfer"]
    amount: float
    currency: str
    merchant: Optional[str] = None
    note: Optional[str] = None
    date_time: datetime

class OperationCreate(OperationBase):
    pass

class OperationResponse(OperationBase):
    id: int
    class Config:
        from_attributes = True

# --- History (UI layer) ---

class HistoryItem(BaseModel):
    id: int
    account_id: int
    category_id: int
    type: Literal["income", "expense", "transfer"]
    amount: float
    currency: str
    merchant: Optional[str]
    note: Optional[str]
    date_time: datetime

class HistorySection(BaseModel):
    id: str
    dateLabel: str
    items: List[HistoryItem]
