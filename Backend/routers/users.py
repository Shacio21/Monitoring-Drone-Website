from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import User
from schemas import UserOut, MessageResponse
from schemas import UserOut, MessageResponse, UserUpdateRequest  # tambah UserUpdateRequest
router = APIRouter(prefix="/users", tags=["Users"])


@router.get(
    "/",
    response_model=List[UserOut],
    summary="Ambil semua user",
)
def get_all_users(db: Session = Depends(get_db)):
    return db.query(User).all()


@router.get(
    "/{user_id}",
    response_model=UserOut,
    summary="Ambil user berdasarkan ID",
)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User tidak ditemukan",
        )
    return user


@router.delete(
    "/{user_id}",
    response_model=MessageResponse,
    summary="Hapus user berdasarkan ID",
)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User tidak ditemukan",
        )
    db.delete(user)
    db.commit()
    return {"message": f"User '{user.username}' berhasil dihapus"}

@router.put(
    "/{user_id}",
    response_model=UserOut,
    summary="Update user berdasarkan ID",
)
def update_user(user_id: int, payload: UserUpdateRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User tidak ditemukan",
        )

    update_data = {}
    if payload.username:
        update_data["username"] = payload.username
    if payload.email:
        update_data["email"] = payload.email
    if payload.host:
        update_data["host"] = payload.host
    if payload.port:
        update_data["port"] = payload.port
    if payload.battery_topic:
        update_data["battery_topic"] = payload.battery_topic
    if payload.water_topic:
        update_data["water_topic"] = payload.water_topic
    if payload.attitude_topic:
        update_data["attitude_topic"] = payload.attitude_topic
    if payload.gps_topic:
        update_data["gps_topic"] = payload.gps_topic
    if payload.video_url:
        update_data["video_url"] = payload.video_url

    for key, value in update_data.items():
        setattr(user, key, value)

    db.commit()
    db.refresh(user)
    return user