@echo off
setlocal enabledelayedexpansion

title Antigravity 1.12.2 RTM Server Launcher

:: ==================================================
::   Minecraft 1.12.2 Forge / RTM サーバー起動スクリプト
:: ==================================================

:: バージョンとメモリ設定
set "VERSION=1.12.2"
set "RAM=6G"

:: 起動ターゲットの自動検出 (Antigravity または Forge)
set "JAR_NAME="
for %%f in (Antigravity-!VERSION!-*.jar forge-!VERSION!-*-universal.jar forge-!VERSION!-universal.jar) do (
    set "JAR_NAME=%%f"
)

:menu
cls
echo ==================================================
echo   Antigravity !VERSION! RTM Server Auto-Launcher
echo ==================================================
echo.
echo   【現在の設定】
if defined JAR_NAME (
    echo   - 起動JAR: !JAR_NAME! (自動検出済み)
) else (
    echo   - 起動JAR: 見つかりません (forge-!VERSION!-*-universal.jar 等を配置してください)
)
echo   - 割り当てメモリ: !RAM!
echo.
echo   [!] エンターキーを押すとサーバーを開始します...
pause > nul

:start
cls
echo [%date% %time%] Antigravity Server を起動しています...
echo.

:: 🚀 【究極の最適化オプション】 🚀
:: Aikar's Flags をベースにした、MODサーバー（RTM等）向けの低遅延設定です。
:: - UseG1GC: ガベージコレクションを効率化し、ラグスパイクを抑制
:: - MaxGCPauseMillis=50: GCによる一時停止を最小限に（50ms以下）に抑えます
java -Xms!RAM! -Xmx!RAM! ^
  -XX:+UseG1GC -XX:+ParallelRefProcEnabled -XX:MaxGCPauseMillis=50 ^
  -XX:+UnlockExperimentalVMOptions -XX:+DisableExplicitGC -XX:+AlwaysPreTouch ^
  -XX:G1NewSizePercent=30 -XX:G1MaxNewSizePercent=40 -XX:G1HeapRegionSize=8M ^
  -XX:G1ReservePercent=20 -XX:G1HeapWastePercent=5 -XX:G1MixedGCCountTarget=4 ^
  -XX:InitiatingHeapOccupancyPercent=15 -XX:G1MixedGCLiveThresholdPercent=90 ^
  -XX:G1RSetUpdatingPauseTimePercent=5 -XX:SurvivorRatio=32 -XX:+PerfDisableSharedMem ^
  -XX:MaxTenuringThreshold=1 ^
  -jar "!JAR_NAME!" nogui

echo.
echo ==================================================
echo   サーバーが停止しました。5秒後に自動再起動します...
echo   (完全に終了する場合は Ctrl+C を押してください)
echo ==================================================
timeout /t 5
goto start
