from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import User
from schemas import RegisterRequest, RegisterResponse, LoginRequest, LoginResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=RegisterResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Daftar akun baru",
)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    # Cek username sudah ada
    if db.query(User).filter(User.username == payload.username).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username sudah digunakan",
        )

    # Cek email sudah ada
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email sudah digunakan",
        )

    # Simpan user beserta konfigurasi device/MQTT
    new_user = User(
        username=payload.username,
        email=payload.email,
        password=payload.password,
        host=payload.host,
        port=payload.port,
        battery_topic=payload.battery_topic,
        water_topic=payload.water_topic,
        attitude_topic=payload.attitude_topic,
        gps_topic=payload.gps_topic,
        video_url=payload.video_url,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return RegisterResponse(
        message="Registrasi berhasil",
        user_id=new_user.id,
        username=new_user.username,
        email=new_user.email,
        host=new_user.host,
        port=new_user.port,
        battery_topic=new_user.battery_topic,
        water_topic=new_user.water_topic,
        attitude_topic=new_user.attitude_topic,
        gps_topic=new_user.gps_topic,
        video_url=new_user.video_url,
    )


@router.post(
    "/login",
    response_model=LoginResponse,
    summary="Login dengan username & password",
)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == payload.username).first()

    if not user or user.password != payload.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username atau password salah",
        )

    return LoginResponse(
        message="Login berhasil",
        user_id=user.id,
        username=user.username,
        email=user.email,
        host=user.host,
        port=user.port,
        battery_topic=user.battery_topic,
        water_topic=user.water_topic,
        attitude_topic=user.attitude_topic,
        gps_topic=user.gps_topic,
        video_url=user.video_url,
    )