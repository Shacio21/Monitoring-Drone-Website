# 🔐 Auth API — FastAPI + PostgreSQL

API sederhana untuk **Register** dan **Login** tanpa enkripsi, dibangun dengan FastAPI dan PostgreSQL.

---

## 📁 Struktur Project

```
auth_app/
├── main.py          # Entry point aplikasi
├── database.py      # Koneksi & session database
├── models.py        # Model SQLAlchemy (tabel users)
├── schemas.py       # Schema Pydantic (request/response)
├── requirements.txt
├── .env.example
└── routers/
    ├── auth.py      # Endpoint /auth/register & /auth/login
    └── users.py     # Endpoint CRUD users
```

---

## ⚙️ Setup & Instalasi

### 1. Buat virtual environment
```bash
python -m venv venv
source venv/bin/activate        # Linux/Mac
venv\Scripts\activate           # Windows
```

### 2. Install dependencies
```bash
pip install -r requirements.txt
```

### 3. Siapkan PostgreSQL
Buat database di PostgreSQL:
```sql
CREATE DATABASE auth_db;
```

### 4. Konfigurasi .env
Salin `.env.example` menjadi `.env` lalu sesuaikan:
```bash
cp .env.example .env
```

Isi `.env`:
```
DATABASE_URL=postgresql://postgres:PASSWORD@localhost:5432/auth_db
```

### 5. Jalankan server
```bash
uvicorn main:app --reload
```

Server berjalan di: **http://localhost:8000**

---

## 📡 Endpoint API

| Method | URL | Deskripsi |
|--------|-----|-----------|
| `GET` | `/` | Cek status API |
| `POST` | `/auth/register` | Daftar akun baru |
| `POST` | `/auth/login` | Login |
| `GET` | `/users/` | Daftar semua user |
| `GET` | `/users/{id}` | Detail user by ID |
| `DELETE` | `/users/{id}` | Hapus user by ID |

---

## 📝 Contoh Request

### Register
```http
POST /auth/register
Content-Type: application/json

{
  "username": "budi",
  "email": "budi@email.com",
  "password": "rahasia123"
}
```

**Response (201):**
```json
{
  "message": "Registrasi berhasil",
  "user_id": 1,
  "username": "budi",
  "email": "budi@email.com"
}
```

---

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "username": "budi",
  "password": "rahasia123"
}
```

**Response (200):**
```json
{
  "message": "Login berhasil",
  "user_id": 1,
  "username": "budi",
  "email": "budi@email.com"
}
```

---

## 📖 Dokumentasi Interaktif

Setelah server berjalan, buka:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
