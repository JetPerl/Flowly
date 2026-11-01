

from datetime import datetime

from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from database import Base


class CryptoAsset(Base):
    """Крипто-актив внутри криптосчёта.

    Один Account (криптосчёт, например Bybit) может иметь много CryptoAsset
    (BTC, ETH, TON и т.д.). Эта модель описывает текущее состояние позиции
    по каждой монете для конкретного счёта.
    """

    __tablename__ = "crypto_assets"

    id = Column(Integer, primary_key=True, index=True)

    # Ссылка на счёт (Bybit, Binance, Ledger и т.п.)
    account_id = Column(
        Integer,
        ForeignKey("accounts.id", ondelete="CASCADE"),
        nullable=False,
    )

    # Что за актив
    symbol = Column(String(20), nullable=False)       # BTC, ETH, TON и т.п.
    name = Column(String(100), nullable=False)        # Bitcoin, Ethereum, Toncoin
    icon = Column(String(50), nullable=True)          # опционально: имя иконки

    # Количество монет/токенов
    amount = Column(Numeric(38, 18), nullable=False, default=0)

    # Средняя цена покупки (для расчёта PnL)
    avg_buy_price = Column(Numeric(38, 10), nullable=True)

    # Текущая рыночная цена и оценка позиции
    current_price = Column(Numeric(38, 10), nullable=True)
    value = Column(Numeric(38, 10), nullable=True)    # amount * current_price

    # Нереализованная прибыль/убыток
    pnl = Column(Numeric(38, 10), nullable=True)
    pnl_percent = Column(Numeric(10, 5), nullable=True)

    # В какой валюте считаем цену/стоимость (обычно USD)
    currency = Column(String(10), nullable=False, default="USD")

    # Временные метки
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)