HOMECART ANDROID APP - FIXED PDF PRINTING
==========================================

This version keeps the existing HomeCart website, local shopping list,
voice input, smart quantity/category detection and UI.

PDF FIX:
- The Create PDF button now calls the native Android Print framework when
  running inside the APK.
- The Android print screen can use "Save as PDF" to save the shopping list.
- The normal browser version still uses window.print().
- A4 print size is requested by the Android app.

BUILD FROM CMD
==============

Requirements:
1. JDK 17 installed and JAVA_HOME set.
2. Android SDK installed with platform 35 and build-tools.
3. Gradle 8.9 available in PATH (Android Gradle Plugin 8.7.3).

From this project folder:
    gradle wrapper --gradle-version 8.9
    gradlew.bat assembleDebug

The APK will be created at:
    app\build\outputs\apk\debug\app-debug.apk

You can then copy app-debug.apk to an Android phone and install it.

If Windows blocks installation, allow installation of APKs from the file
manager/browser you used to open the APK.
