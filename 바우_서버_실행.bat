@echo off
chcp 65001 > nul
title BAU RECIPE BOOK SERVER
cls
echo ===================================================
echo   [BAU RECIPE BOOK] 모바일 & PC 로컬 서버 가동 중
echo ===================================================
echo.
echo [1] AI 창을 완전히 꺼도 컴퓨터에서 독립 실행됩니다.
echo [2] 외부 접속용 터널도 백그라운드에서 자동 가동됩니다.
echo.
start /b npx -y localtunnel --port 8080 --subdomain stale-bugs-sit
python app.py
pause

