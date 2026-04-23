@echo off
setlocal

cd /d "%~dp0"
powershell -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-game.ps1" -AutoUpdate

if errorlevel 1 (
  pause
)
