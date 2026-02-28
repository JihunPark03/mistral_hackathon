"""FastAPI application — AgentLance backend with auth + model uploads."""

from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Annotated

import jwt
from fastapi import Depends, FastAPI, HTTPException, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from jwt import InvalidTokenError
from passlib.context import CryptContext
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from backend.config import get_settings
from backend.db.database import get_db, init_db
from backend.db.models import UserModel
from backend.db_login_crud import (
    create_user,
    delete_user,
    get_user_by_id,
    get_user_id,
    get_user_role,
    get_users,
)
from backend.db.seed import seed_agents
from backend.api import agents, jobs, mesh, ws


settings = get_settings()
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = 30
COOKIE_NAME = "access_token"


# -------------------------
# Pydantic Schemas
# -------------------------

class TokenData(BaseModel):
    id: int


class User(BaseModel):
    userid: int
    username: str
    email: str | None = None
    full_name: str | None = None
    disabled: bool | None = None


class UserInDB(User):
    hashed_password: str


class RegisterInformation(BaseModel):
    username: str
    full_name: str
    email: str
    password: str


class DeletingInformation(BaseModel):
    username: str
    password: str


# -------------------------
# Utility functions
# -------------------------

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


async def get_user(db: AsyncSession, id: int) -> UserInDB | None:
    user = await get_user_by_id(db, id)
    if not user:
        return None
    return UserInDB(
        userid=user.id,
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        disabled=user.disabled,
        hashed_password=user.hashed_password,
    )


async def authenticate_user(db: AsyncSession, id: int | None, password: str):
    if id is None:
        return None
    user = await get_user(db, id)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# -------------------------
# Lifespan
# -------------------------

from contextlib import asynccontextmanager


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    await seed_agents()
    yield


app = FastAPI(
    title="AgentLance",
    description="AI Agent Marketplace — Fiverr for AI agents on a mesh network",
    version="0.2.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins if settings.allowed_origins != ["*"] else ["*"],
    allow_origin_regex=settings.allow_origin_regex or (".*" if settings.allowed_origins == ["*"] else None),
    allow_credentials=False if "*" in settings.allowed_origins else True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for deliverables
static_dir = Path(__file__).parent / "static" / "deliverables"
static_dir.mkdir(parents=True, exist_ok=True)
app.mount("/static/deliverables", StaticFiles(directory=str(static_dir)), name="deliverables")

# Existing feature routers
app.include_router(agents.router)
app.include_router(jobs.router)
app.include_router(mesh.router)
app.include_router(ws.router)


# -------------------------
# Auth dependencies
# -------------------------

async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        user_id_int = int(user_id)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = await get_user(db, user_id_int)
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")

    return user


async def get_current_active_user(
    current_user: Annotated[User, Depends(get_current_user)],
):
    if current_user.disabled:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


# -------------------------
# Auth routes
# -------------------------

@app.post("/token")
async def login_for_access_token(
    response: Response,
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: AsyncSession = Depends(get_db),
):
    user_id = await get_user_id(db, form_data.username)
    user = await authenticate_user(db, user_id, form_data.password)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.userid)},
        expires_delta=access_token_expires,
    )

    response.set_cookie(
        key=COOKIE_NAME,
        value=access_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )

    return {"message": "ok"}


@app.post("/logout")
async def logout(response: Response):
    response.delete_cookie(COOKIE_NAME, path="/")
    return {"message": "Logged out"}


@app.get("/users/me/", response_model=User)
async def read_users_me(
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    return current_user


@app.get("/user/role")
async def get_role(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: AsyncSession = Depends(get_db),
):
    role = await get_user_role(db, current_user.userid)
    if role is None:
        raise HTTPException(status_code=404, detail="User not found")
    return {"id": current_user.userid, "role": role.value}


@app.post("/register")
async def register(data: RegisterInformation, db: AsyncSession = Depends(get_db)):
    existing_user_id = await get_user_id(db, data.username)
    if existing_user_id:
        raise HTTPException(status_code=400, detail="User already registered")

    await create_user(db, data.username, data.full_name, data.email, data.password)
    return {"message": "User registered successfully"}


@app.get("/get_all_user")
async def get_all_user(db: AsyncSession = Depends(get_db)):
    response = await get_users(db)
    return response


@app.delete("/delete_an_user")
async def delete_an_user(data: DeletingInformation, db: AsyncSession = Depends(get_db)):
    response = await delete_user(db, data.username, data.password)
    return response


@app.get("/")
async def root():
    return {
        "name": "AgentLance",
        "version": "0.2.0",
        "description": "AI Agent Marketplace — Fiverr for AI agents",
    }
