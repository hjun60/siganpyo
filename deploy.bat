@echo off
chcp 65001 >nul
echo.
echo ===== Luna's 시간표 배포 =====
echo.

REM Netlify CLI 확인
where netlify >nul 2>nul
if %errorlevel% neq 0 (
    echo [오류] Netlify CLI가 설치되어 있지 않습니다.
    echo.
    echo 설치 방법: npm install -g netlify-cli
    echo (Node.js가 먼저 설치되어 있어야 합니다: https://nodejs.org)
    echo.
    pause
    exit /b 1
)

echo 배포 중...
netlify deploy --prod
if %errorlevel% neq 0 (
    echo.
    echo [주의] 처음이라면 다음을 먼저 실행하세요:
    echo   1. netlify login   (브라우저에서 로그인)
    echo   2. netlify link   (사이트 연결)
    echo   3. 다시 deploy.bat 실행
    echo.
    pause
    exit /b 1
)

echo.
echo ===== 배포 완료 =====
echo.
pause
