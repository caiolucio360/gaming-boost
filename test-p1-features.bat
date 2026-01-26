@echo off
REM P1 Features Quick Smoke Test Script (Windows)
REM Run this to quickly verify all P1 features are working

echo.
echo Starting P1 Features Smoke Tests...
echo ======================================
echo.

set BASE_URL=http://localhost:3000
set PASSED=0
set FAILED=0

REM Test 1: Legal Pages
echo Test 1: Legal Pages
curl -s -o nul -w "Terms of Service: %%{http_code}\n" %BASE_URL%/terms
curl -s -o nul -w "Privacy Policy: %%{http_code}\n" %BASE_URL%/privacy
echo.

REM Test 2: Admin Service CRUD Removed
echo Test 2: Admin Service CRUD Removed (should be 404)
curl -s -o nul -w "Admin Services: %%{http_code}\n" %BASE_URL%/admin/services
curl -s -o nul -w "Admin Services API: %%{http_code}\n" %BASE_URL%/api/admin/services
echo.

REM Test 3: Pricing Calculator
echo Test 3: Pricing Calculator
curl -s -o nul -w "CS2 Pricing Page: %%{http_code}\n" %BASE_URL%/games/cs2/pricing
echo.

REM Test 4: Rate Limiting
echo Test 4: Rate Limiting (6 login attempts)
for /L %%i in (1,1,6) do (
    curl -s -o nul -w "Attempt %%i: %%{http_code}\n" ^
        -X POST %BASE_URL%/api/auth/login ^
        -H "Content-Type: application/json" ^
        -d "{\"email\":\"test@test.com\",\"password\":\"wrong\"}"
    timeout /t 1 /nobreak >nul
)
echo Expected: First 5 should be 401, 6th should be 429
echo.

REM Test 5: Portuguese Error Messages
echo Test 5: Portuguese Error Messages
curl -s -X POST %BASE_URL%/api/pricing/calculate ^
    -H "Content-Type: application/json" ^
    -d "{\"game\":\"CS2\",\"gameMode\":\"PREMIER\",\"current\":15000,\"target\":10000}"
echo.
echo Expected: Error message should be in Portuguese
echo.

echo ======================================
echo Tests Complete!
echo ======================================
echo.
echo Next steps:
echo 1. Open browser and test UI features manually
echo 2. Check TEST_PLAN.md for detailed test cases
echo 3. Follow the checklist in TEST_PLAN.md
echo.
pause
