from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from passlib.context import CryptContext

from backend.db.models import UserModel, UserRole, Folder, ModelRecord

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


async def get_user_id(db: AsyncSession, username: str):
    result = await db.execute(select(UserModel).where(UserModel.username == username))
    user = result.scalars().first()
    return user.id if user else None


async def get_user_by_id(db: AsyncSession, user_id: int):
    result = await db.execute(select(UserModel).where(UserModel.id == user_id))
    return result.scalars().first()


async def get_users(db: AsyncSession):
    result = await db.execute(select(UserModel))
    return result.scalars().all()


async def get_user_role(db: AsyncSession, user_id: int):
    result = await db.execute(select(UserModel).where(UserModel.id == user_id))
    data = result.scalars().first()
    return data.role if data else None


async def delete_user(db: AsyncSession, username: str, password: str):
    result = await db.execute(select(UserModel).where(UserModel.username == username))
    user = result.scalars().first()
    if not user:
        return False

    if not pwd_context.verify(password, user.hashed_password):
        return False

    await db.delete(user)
    await db.commit()
    return True


async def create_user(db: AsyncSession, username: str, full_name: str | None, email: str, password: str):
    hashed_password = pwd_context.hash(password)
    new_user = UserModel(
        username=username,
        full_name=full_name,
        email=email,
        hashed_password=hashed_password,
        role=UserRole.user,
    )

    db.add(new_user)
    await db.flush()  # assign PK

    root_folder = Folder(
        name=username,
        path="/",
        depth=0,
        user_id=new_user.id,
    )
    db.add(root_folder)

    await db.commit()
    await db.refresh(new_user)

    return new_user


async def list_user_models(db: AsyncSession, user_id: int):
    result = await db.execute(select(ModelRecord).where(ModelRecord.owner_id == user_id))
    return result.scalars().all()


async def add_model(db: AsyncSession, user_id: int, name: str, description: str, source_url: str, tag: str):
    model = ModelRecord(
        name=name,
        description=description,
        source_url=source_url,
        tag=tag,
        owner_id=user_id,
    )
    db.add(model)
    await db.commit()
    await db.refresh(model)
    return model


async def delete_model(db: AsyncSession, user_id: int, model_id: int):
    result = await db.execute(select(ModelRecord).where(ModelRecord.id == model_id, ModelRecord.owner_id == user_id))
    model = result.scalars().first()
    if not model:
        return False
    await db.delete(model)
    await db.commit()
    return True
