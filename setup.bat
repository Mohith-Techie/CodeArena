@echo off
echo ============================================================
echo   CodeArena — First-Time Setup Script
echo ============================================================
echo.

REM Check Docker is running
docker info > nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker Desktop is not running. Please start it first.
    pause
    exit /b 1
)
echo [OK] Docker Desktop is running.

REM Pull sandbox images
echo.
echo [1/4] Pulling sandbox Docker images (this may take a while)...
docker pull python:3.12-slim
docker pull node:20-slim
docker pull eclipse-temurin:21-jdk-slim
docker pull gcc:14
echo [OK] All sandbox images pulled.

REM Build and start services
echo.
echo [2/4] Building and starting all services...
docker-compose up --build -d
echo [OK] Services started.

REM Wait for postgres to be ready
echo.
echo [3/4] Waiting for database to be ready...
timeout /t 10 /nobreak > nul
docker exec codearena_api npx prisma db push --accept-data-loss
echo [OK] Database schema applied.

REM Seed data
echo.
echo [4/4] Seeding 15 problems into database...
docker exec codearena_api npm run db:seed
echo [OK] Database seeded.

echo.
echo ============================================================
echo   Setup Complete!
echo   Open http://localhost:5173 in your browser
echo ============================================================
echo.
pause
