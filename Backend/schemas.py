from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional


# ── Register ──────────────────────────────────────────────
class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str

    # Device / MQTT configuration
    host: Optional[str] = None
    port: Optional[int] = None
    battery_topic: Optional[str] = None
    water_topic: Optional[str] = None
    attitude_topic: Optional[str] = None
    gps_topic: Optional[str] = None
    video_url: Optional[str] = None


class RegisterResponse(BaseModel):
    message: str
    user_id: int
    username: str
    email: str
    host: Optional[str] = None
    port: Optional[int] = None
    battery_topic: Optional[str] = None
    water_topic: Optional[str] = None
    attitude_topic: Optional[str] = None
    gps_topic: Optional[str] = None
    video_url: Optional[str] = None

    class Config:
        from_attributes = True


# ── Login ─────────────────────────────────────────────────
class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    message: str
    user_id: int
    username: str
    email: str
    host: Optional[str] = None
    port: Optional[int] = None
    battery_topic: Optional[str] = None
    water_topic: Optional[str] = None
    attitude_topic: Optional[str] = None
    gps_topic: Optional[str] = None
    video_url: Optional[str] = None

# ── User ──────────────────────────────────────────────────
class UserOut(BaseModel):
    id: int
    username: str
    email: str
    host: Optional[str] = None
    port: Optional[int] = None
    battery_topic: Optional[str] = None
    water_topic: Optional[str] = None
    attitude_topic: Optional[str] = None
    gps_topic: Optional[str] = None
    video_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class UserUpdateRequest(BaseModel):
    username: str
    email: EmailStr
    host: Optional[str] = None
    port: Optional[int] = None
    battery_topic: Optional[str] = None
    water_topic: Optional[str] = None
    attitude_topic: Optional[str] = None
    gps_topic: Optional[str] = None
    video_url: Optional[str] = None

# ── Generic ───────────────────────────────────────────────
class MessageResponse(BaseModel):
    message: str