@echo off
setlocal EnableExtensions

rem === Projektrod ===
cd /d C:\humlumdartklub

rem === Læs værdier fra .env.local (read-only) ===
for /f "usebackq delims=" %%I in (`powershell -NoProfile -Command ^
  "(Get-Content '.env.local' | Where-Object {$_ -match '^NEXT_PUBLIC_SHEET_API='} | Select-Object -First 1) -replace '^(?:NEXT_PUBLIC_SHEET_API=)\"?(.+?)\"?$', '$1'"`) do set "BASE=%%I"

for /f "usebackq delims=" %%I in (`powershell -NoProfile -Command ^
  "(Get-Content '.env.local' | Where-Object {$_ -match '^ADMIN_TOKEN='} | Select-Object -First 1) -replace '^(?:ADMIN_TOKEN=)\"?(.+?)\"?$', '$1'"`) do set "KEY=%%I"

echo.
echo ==== ENV CHECK ====
echo NEXT_PUBLIC_SHEET_API = %BASE%
echo ADMIN_TOKEN            = %KEY%
echo.

rem === Test lokal proxy (vores Next.js endpoint) ===
echo ==== LOCAL: /api/admin/indmeldinger ====
curl -s -i http://localhost:3000/api/admin/indmeldinger
echo.

rem === Test upstream direkte mod GAS (samme endpoint som HP bruger) ===
echo ==== UPSTREAM: GAS Web App ====
if defined KEY (
  curl -s -i "%BASE%?tab=INDMELDINGER&key=%KEY%"
) else (
  curl -s -i "%BASE%?tab=INDMELDINGER"
)
echo.
echo (Intet af ovenstående aendrer noget - det er kun laesning.)
pause
endlocal
