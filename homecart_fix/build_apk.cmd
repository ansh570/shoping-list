@echo off
setlocal
cd /d "%~dp0"

echo ========================================
echo        HomeCart APK Builder
echo ========================================
echo.

where gradle >nul 2>nul
if errorlevel 1 (
    echo ERROR: Gradle was not found in PATH.
    echo Install Gradle 8.9 or add it to PATH, then run this file again.
    echo.
    pause
    exit /b 1
)

gradle wrapper --gradle-version 8.9
if errorlevel 1 (
    echo ERROR: Could not create the Gradle wrapper.
    pause
    exit /b 1
)

call gradlew.bat assembleDebug
if errorlevel 1 (
    echo.
    echo ERROR: APK build failed. Read the error above.
    pause
    exit /b 1
)

echo.
echo ========================================
echo APK BUILD SUCCESSFUL
echo ========================================
echo.
echo APK:
echo %CD%\app\build\outputs\apk\debug\app-debug.apk
if exist "app\build\outputs\apk\debug\app-debug.apk" copy /Y "app\build\outputs\apk\debug\app-debug.apk" "HomeCart-debug.apk" >nul
echo.
echo A copy was also placed here:
echo %CD%\HomeCart-debug.apk
pause
