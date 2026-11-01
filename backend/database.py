from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# !!! ВАЖНО: подставь свои данные доступа !!!
# Пример: пользователь ilaburnos, база flowly_db без пароля
# Если есть пароль: postgresql+psycopg2://user:password@localhost/dbname
SQLALCHEMY_DATABASE_URL = "postgresql+psycopg2://ilaburnos@localhost/ilaburnos"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    echo=False,               # можно True, чтобы видеть SQL в терминале
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()