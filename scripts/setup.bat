@echo off
REM Blog Application Docker Setup Script for Windows

echo 🚀 Setting up Blog Application with Docker...

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed. Please install Docker first.
    pause
    exit /b 1
)

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose is not installed. Please install Docker Compose first.
    pause
    exit /b 1
)

REM Create environment files if they don't exist
echo 📝 Setting up environment files...

if not exist "api\.env" (
    copy "api\.env.example" "api\.env"
    echo ✅ Created api\.env from example
)

if not exist "client\.env.local" (
    copy "client\.env.local.example" "client\.env.local"
    echo ✅ Created client\.env.local from example
)

REM Ask user which environment to run
echo.
echo 🔧 Which environment would you like to run?
echo 1) Production (docker-compose.yml)
echo 2) Development with hot reload (docker-compose.dev.yml)
set /p choice="Enter your choice (1 or 2): "

if "%choice%"=="1" (
    set COMPOSE_FILE=docker-compose.yml
    echo 🏭 Starting production environment...
) else if "%choice%"=="2" (
    set COMPOSE_FILE=docker-compose.dev.yml
    echo 🛠️ Starting development environment with hot reload...
) else (
    echo ❌ Invalid choice. Defaulting to development environment.
    set COMPOSE_FILE=docker-compose.dev.yml
)

REM Build and start services
echo 🔨 Building and starting services...
docker-compose -f %COMPOSE_FILE% up --build -d

REM Wait for services to be ready
echo ⏳ Waiting for services to be ready...
timeout /t 30 /nobreak >nul

REM Initialize database
echo 🗄️ Initializing database...
curl -X POST http://localhost:8080/api/init-db || echo ⚠️ Database initialization failed. You may need to run this manually.

echo.
echo 🎉 Setup complete!
echo.
echo 📱 Application URLs:
echo    Frontend: http://localhost:3000
echo    API:      http://localhost:8080
echo    Health:   http://localhost:8080/health
echo.
echo 🗄️ Database Connection:
echo    Host:     localhost
echo    Port:     1433
echo    Database: blog
echo    Username: sa
echo    Password: BlogApp123!
echo.
echo 🔧 Useful commands:
echo    View logs:    docker-compose -f %COMPOSE_FILE% logs -f
echo    Stop:         docker-compose -f %COMPOSE_FILE% down
echo    Restart:      docker-compose -f %COMPOSE_FILE% restart
echo    Clean up:     docker-compose -f %COMPOSE_FILE% down -v
echo.
pause