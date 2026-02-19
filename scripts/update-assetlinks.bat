@echo off
echo ============================================
echo   Digital Asset Links 업데이트
echo   (TWA 빌드 후 실행)
echo ============================================
echo.

if not exist "%~dp0..\android-twa\nyanquest-keystore.jks" (
    echo [ERROR] keystore 파일을 찾을 수 없습니다.
    echo 먼저 build-twa.bat를 실행해주세요.
    pause
    exit /b 1
)

echo Keystore에서 SHA-256 지문 추출 중...
echo.
echo Keystore 비밀번호를 입력하세요:

keytool -list -v -keystore "%~dp0..\android-twa\nyanquest-keystore.jks" -alias nyanquest 2>nul | findstr "SHA256"

echo.
echo 위의 SHA-256 지문을 복사해서
echo public\.well-known\assetlinks.json 파일의
echo __SIGNING_KEY_SHA256_FINGERPRINT__ 부분을 교체하세요.
echo.
echo 교체 후 Vercel에 재배포하면 완료!
echo.
pause
