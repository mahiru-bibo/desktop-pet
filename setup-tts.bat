@echo off
chcp 65001 >nul
echo ================================================
echo   Desktop Pet TTS — 一键安装 (GPT-SoVITS + Sakura)
echo ================================================
echo.

set "TTS_DIR=%USERPROFILE%\gpt-sovits"

:: ── 1. Clone GPT-SoVITS ──
if exist "%TTS_DIR%\GPT-SoVITS" (
    echo [1/5] GPT-SoVITS 目录已存在，跳过克隆
) else (
    echo [1/5] 克隆 GPT-SoVITS...
    mkdir "%TTS_DIR%" 2>nul
    git clone https://github.com/RVC-Boss/GPT-SoVITS.git "%TTS_DIR%\GPT-SoVITS"
    if errorlevel 1 (
        echo 克隆失败，请检查网络连接
        pause
        exit /b 1
    )
)

:: ── 2. Copy config and reference audio ──
echo [2/5] 复制 TTS 配置和参考音频...
copy /Y "%~dp0tts\tts_infer.yaml" "%TTS_DIR%\GPT-SoVITS\GPT_SoVITS\configs\tts_infer.yaml" >nul
xcopy /Y /E "%~dp0tts\sakura_refs\*" "%TTS_DIR%\GPT-SoVITS\sakura_refs\" >nul
echo       配置和参考音频已复制

:: ── 3. Install Python dependencies ──
echo [3/5] 安装 Python 依赖...
pip install -r "%TTS_DIR%\GPT-SoVITS\requirements.txt" --quiet
if errorlevel 1 (
    echo 安装失败，请确认 Python 已安装并加入 PATH
    pause
    exit /b 1
)

:: ── 4. Download Sakura voice models ──
echo [4/5] Sakura 语音模型 (夜乃桜)...

set "SAKURA_DIR=%TTS_DIR%\GPT-SoVITS\sakura_models"
if not exist "%SAKURA_DIR%" mkdir "%SAKURA_DIR%"

:: Check if models exist locally (copy from existing install)
set "LOCAL_SAKURA=%USERPROFILE%\gpt-sovits\GPT-SoVITS\sakura_models"
if exist "%LOCAL_SAKURA%\Sakura-e15.ckpt" if not exist "%SAKURA_DIR%\Sakura-e15.ckpt" (
    echo       从本地复制 Sakura-e15.ckpt...
    copy /Y "%LOCAL_SAKURA%\Sakura-e15.ckpt" "%SAKURA_DIR%" >nul
)
if exist "%LOCAL_SAKURA%\Sakura_e8_s7176.pth" if not exist "%SAKURA_DIR%\Sakura_e8_s7176.pth" (
    echo       从本地复制 Sakura_e8_s7176.pth...
    copy /Y "%LOCAL_SAKURA%\Sakura_e8_s7176.pth" "%SAKURA_DIR%" >nul
)

:: Check standing
if not exist "%SAKURA_DIR%\Sakura-e15.ckpt" (
    echo.
    echo   ⚠ 警告: 未找到 Sakura-e15.ckpt (149MB)
    echo   请手动下载到: %SAKURA_DIR%
    echo   下载地址请参考项目 README
    echo.
)
if not exist "%SAKURA_DIR%\Sakura_e8_s7176.pth" (
    echo   ⚠ 警告: 未找到 Sakura_e8_s7176.pth (165MB)
    echo   请手动下载到: %SAKURA_DIR%
    echo.
)

:: ── 5. Done ──
echo [5/5] 完成！
echo.
echo ================================================
echo   安装完成！现在可以用桌面快捷方式启动桌宠了
echo   或运行: %~dp0launch.bat
echo ================================================
pause
