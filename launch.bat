@echo off
chcp 65001 >nul
title 椎名真昼 Desktop Pet

echo ================================
echo   椎名真昼 Desktop Pet Launcher
echo ================================
echo.

:: ── Start GPT-SoVITS TTS API ──
echo [1/2] Starting GPT-SoVITS TTS API (port 9880)...
set "FFMPEG_BIN=C:\Users\bibob\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg.Shared_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.1.1-full_build-shared\bin"
set "PATH=%PATH%;%FFMPEG_BIN%"
set "PYTHONUTF8=1"

start "GPT-SoVITS" /min C:\Users\bibob\AppData\Local\Python311\python.exe ^
  C:\Users\bibob\gpt-sovits\GPT-SoVITS\api_v2.py ^
  -a 127.0.0.1 -p 9880 ^
  -c C:\Users\bibob\gpt-sovits\GPT-SoVITS\GPT_SoVITS\configs\tts_infer.yaml

:: ── Wait for server warm-up ──
echo Waiting for TTS API to warm up (15s)...
timeout /t 15 /nobreak

:: ── Start Desktop Pet ──
echo [2/2] Starting Desktop Pet...
cd /d C:\Users\bibob\desktop-pet
call npm run build
start "" npx electron .

echo.
echo Done! Desktop Pet is running. You can close this window.
timeout /t 3 /nobreak >nul
