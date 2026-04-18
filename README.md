# 🚁 AgriDrone Monitor

> A real-time agricultural drone monitoring platform for live telemetry, GPS tracking, and field surveillance — built for precision agriculture operations.

![Tech Stack](https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-blue?style=flat-square&logo=react)
![Backend](https://img.shields.io/badge/Backend-FastAPI-green?style=flat-square&logo=fastapi)
![Database](https://img.shields.io/badge/Database-PostgreSQL-blue?style=flat-square&logo=postgresql)
![Docker](https://img.shields.io/badge/Deploy-Docker-2496ED?style=flat-square&logo=docker)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Run with Docker (Recommended)](#run-with-docker-recommended)
  - [Run Locally (Development)](#run-locally-development)
- [Environment Variables](#-environment-variables)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)

---

## 🌾 Overview

**AgriDrone Monitor** is a full-stack web application designed for monitoring agricultural drones in real time. The platform provides operators and stakeholders with a centralized dashboard to track drone position, monitor critical telemetry data, and view live camera feeds — ensuring safe and efficient agricultural operations.

---

## ✨ Features

| Feature | Description |
|---|---|
| 📍 **GPS Tracking** | Real-time drone position tracking on an interactive map |
| 📡 **Live Telemetry** | Monitor attitude, speed, altitude, and flight status |
| 🔋 **Battery Monitor** | Live battery level with low-battery alerts |
| 💧 **Water Level Monitor** | Track remaining liquid/pesticide payload for spraying operations |
| 🎥 **Realtime Camera** | Live video feed streamed directly from the drone |
| 🔐 **Authentication** | Secure login system with role-based access control |

---

## 🛠 Tech Stack

**Frontend**
- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) — component-based UI with type safety
- [Vite](https://vitejs.dev/) — fast development build tool
- [Nginx](https://nginx.org/) — production web server & reverse proxy

**Backend**
- [FastAPI](https://fastapi.tiangolo.com/) — high-performance Python API framework
- [SQLAlchemy](https://www.sqlalchemy.org/) — ORM for database interaction
- [Uvicorn](https://www.uvicorn.org/) — ASGI server

**Database**
- [PostgreSQL](https://www.postgresql.org/) — relational database for persistent storage

**Infrastructure**
- [Docker](https://www.docker.com/) + [Docker Compose](https://docs.docker.com/compose/) — containerized deployment

---

## 🏗 System Architecture

```
┌─────────────────────────────────────────────────┐
│                   Client Browser                │
└──────────────────────┬──────────────────────────┘
                       │ HTTP :80
┌──────────────────────▼──────────────────────────┐
│              Frontend (Nginx + React)           │
│                   Port: 80                      │
└──────────────────────┬──────────────────────────┘
                       │ Proxy /api → :8000
┌──────────────────────▼──────────────────────────┐
│              Backend (FastAPI)                  │
│                   Port: 8000                    │
└──────────────────────┬──────────────────────────┘
                       │ SQLAlchemy
┌──────────────────────▼──────────────────────────┐
│              Database (PostgreSQL)              │
│                   Port: 5432                    │
└─────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and **running**
- Git

### Run with Docker (Recommended)

**1. Clone the repository**
```bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
```

**2. Create the backend environment file**

Create `Backend/.env` with the following content:
```env
DATABASE_URL=postgresql://postgres:yourpassword@db:5432/auth_db
```

**3. Update `docker-compose.yml` with your password**

Make sure `POSTGRES_PASSWORD` in `docker-compose.yml` matches the password in your `.env` file.

**4. Build and run all services**
```bash
docker-compose up --build
```

**5. Access the application**

| Service | URL |
|---|---|
| 🌐 Frontend | http://localhost |
| ⚡ Backend API | http://localhost:8000 |
| 📖 API Docs (Swagger) | http://localhost:8000/docs |

---

### Run Locally (Development)

**Backend**
```bash
cd Backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

pip install -r requirements.txt
uvicorn main:app --reload
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

> Make sure PostgreSQL is running locally and `Backend/.env` points to `localhost`.

---

## 🔐 Environment Variables

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:pass@db:5432/auth_db` |

---

## 📁 Project Structure

```
WEBSITE(DRONE)/
├── Backend/
│   ├── routers/            # API route handlers
│   ├── main.py             # FastAPI app entry point
│   ├── models.py           # SQLAlchemy database models
│   ├── schemas.py          # Pydantic request/response schemas
│   ├── database.py         # Database connection setup
│   ├── requirements.txt    # Python dependencies
│   ├── .env                # Environment variables (not committed)
│   └── Dockerfile
│
├── frontend/
│   ├── src/                # React source code
│   ├── public/             # Static assets
│   ├── index.html
│   ├── vite.config.ts
│   ├── nginx.conf          # Nginx config for production
│   └── Dockerfile
│
└── docker-compose.yml      # Multi-container orchestration
```

---

## 📖 API Documentation

Once the backend is running, interactive API documentation is available at:

- **Swagger UI** → http://localhost:8000/docs
- **ReDoc** → http://localhost:8000/redoc

---

## 🐳 Docker Commands Reference

```bash
# Start all services
docker-compose up --build

# Start in background
docker-compose up --build -d

# Stop all services
docker-compose down

# Stop and remove volumes (reset database)
docker-compose down -v

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f backend
```

---

## 📄 License

This project is licensed under the MIT License.
