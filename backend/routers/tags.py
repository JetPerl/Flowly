from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Tag

router = APIRouter(prefix="/tags", tags=["Tags"])


def serialize_tag(tag: Tag):
    return {
        "id": tag.id,
        "name": tag.name,
        "color": tag.color,
        "icon": tag.icon,
    }


@router.get("/")
def get_tags(db: Session = Depends(get_db)):
    tags = db.query(Tag).order_by(Tag.name).all()
    return [serialize_tag(tag) for tag in tags]
