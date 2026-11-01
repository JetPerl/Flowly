from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Category

router = APIRouter(prefix="/categories", tags=["Categories"])


def build_tree(categories):
    """
    Формирует итоговую структуру:
    {
        "income": [...],
        "expense": [...]
    }
    """

    # разделяем категории по типам
    income_raw = [c for c in categories if c.type == "income"]
    expense_raw = [c for c in categories if c.type == "expense"]

    def order_value(cat: Category):
        try:
            return int(cat.sort_order) if cat.sort_order is not None else 10**9
        except Exception:
            return 10**9

    def make_tree(raw):
        ordered_raw = sorted(raw, key=order_value)

        # Готовим словарь id => категория
        by_id = {c.id: c for c in ordered_raw}
        children = {c.id: [] for c in ordered_raw}

        # Наполняем дочерние элементы
        for c in ordered_raw:
            if c.parent_id:
                if c.parent_id in children:
                    children[c.parent_id].append(c)

        # Формируем дерево
        tree = []
        for c in ordered_raw:
            if c.parent_id is None:
                tree.append({
                    "id": c.id,
                    "name": c.name,
                    "color": c.color,
                    "icon": c.icon,
                    "sort_order": c.sort_order,
                    "children": [
                        {
                            "id": ch.id,
                            "name": ch.name,
                            "color": ch.color,
                            "icon": ch.icon,
                            "sort_order": ch.sort_order,
                        }
                        for ch in sorted(children[c.id], key=order_value)
                    ]
                })

        return tree

    return {
        "income": make_tree(income_raw),
        "expense": make_tree(expense_raw),
    }


@router.get("/tree")
def get_category_tree(db: Session = Depends(get_db)):
    categories = db.query(Category).all()
    return build_tree(categories)
