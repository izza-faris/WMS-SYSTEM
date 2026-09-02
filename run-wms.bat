@echo off
title AeroWMS Launcher
echo ========================================================
echo        Starting AeroWMS Full-Stack Application
echo ========================================================
echo.

echo 1. Starting Backend (Spring Boot 3 on port 8080)...
start "AeroWMS Backend (Port 8080)" cmd /k "cd /d %~dp0backend && mvn spring-boot:run"

echo 2. Starting Frontend (Angular 18 on port 4200)...
start "AeroWMS Frontend (Port 4200)" cmd /k "cd /d %~dp0frontend && npm run start"

echo.
echo ========================================================
echo Servers are launching in separate windows!
echo Once started, open your browser at: http://localhost:4200
echo ========================================================
pause
