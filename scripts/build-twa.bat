@echo off
echo ============================================
echo   nyanQuest TWA Build Script
echo   Play Store용 AAB/APK 생성
echo ============================================
echo.

:: Check prerequisites
where java >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Java가 설치되어 있지 않습니다.
    echo JDK 17을 설치해주세요: https://adoptium.net/
    pause
    exit /b 1
)

where bubblewrap >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Bubblewrap CLI를 설치합니다...
    call npm install -g @bubblewrap/cli
)

echo.
echo [Step 1] android-twa 디렉토리 생성...
if not exist "%~dp0..\android-twa" mkdir "%~dp0..\android-twa"
cd /d "%~dp0..\android-twa"

echo.
echo [Step 2] Bubblewrap 초기화 시작...
echo.
echo ========== 설정 가이드 ==========
echo  - JDK 설치 여부: No (이미 설치됨)
echo  - JDK 경로: C:\java\jdk-17.0.14
echo  - Android SDK 설치: Yes
echo  - 나머지: 기본값 Enter
echo  - Keystore 비밀번호: 기억할 수 있는 것으로!
echo ==================================
echo.

bubblewrap init --manifest="https://nyanquest.vercel.app/manifest.webmanifest"

if %errorlevel% neq 0 (
    echo [ERROR] Bubblewrap 초기화 실패
    pause
    exit /b 1
)

echo.
echo [Step 3] APK 빌드...
bubblewrap build

if %errorlevel% neq 0 (
    echo [ERROR] 빌드 실패
    pause
    exit /b 1
)

echo.
echo ============================================
echo   빌드 완료!
echo.
echo   출력 파일:
echo   - app-release-bundle.aab (Play Store 업로드용)
echo   - app-release-signed.apk (직접 설치용)
echo.
echo   다음 단계:
echo   1. Google Play Console에서 앱 생성
echo   2. AAB 파일 업로드
echo   3. assetlinks.json에 서명 키 지문 추가
echo ============================================
pause
