from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.sql import func
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)

    # Device / MQTT configuration
    host = Column(String(255), nullable=True)
    port = Column(Integer, nullable=True)
    battery_topic = Column(String(255), nullable=True)
    water_topic = Column(String(255), nullable=True)
    attitude_topic = Column(String(255), nullable=True)
    gps_topic = Column(String(255), nullable=True)
    video_url = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())