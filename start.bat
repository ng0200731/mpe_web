@echo off
echo Starting J-Long web server...
echo.
start http://localhost:8080/scroll.html
npx http-server . -p 8080 -c-1 --cors
