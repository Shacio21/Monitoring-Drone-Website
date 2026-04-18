from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine
import models
from routers import auth, users

# Buat tabel otomatis jika belum ada
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Auth API",
    description="API sederhana untuk Login & Register menggunakan FastAPI + PostgreSQL",
    version="1.0.0",
)

# CORS (izinkan semua origin untuk development)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Daftarkan router
app.include_router(auth.router)
app.include_router(users.router)


@app.get("/", tags=["Root"])
def root():
    return {
        "message": "Auth API berjalan dengan baik!",
        "docs": "/docs",
        "redoc": "/redoc",
    }
