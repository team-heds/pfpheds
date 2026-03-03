# Bump la version dans les 3 fichiers en une seule commande
# Usage: .\bump-version.ps1        (auto-increment patch)
# Usage: .\bump-version.ps1 0.2.0  (version spécifique)

param([string]$NewVersion = "")

$pkg = Get-Content "package.json" | ConvertFrom-Json
$currentVersion = $pkg.version

if ($NewVersion -eq "") {
    # Auto-increment: 0.1.70 -> 0.1.71
    $parts = $currentVersion.Split(".")
    $parts[2] = [int]$parts[2] + 1
    $NewVersion = $parts -join "."
}

Write-Host "Version: $currentVersion -> $NewVersion" -ForegroundColor Cyan

# 1. package.json
(Get-Content "package.json" -Raw) -replace "`"version`": `"$currentVersion`"", "`"version`": `"$NewVersion`"" | Set-Content "package.json" -NoNewline
Write-Host "  [OK] package.json" -ForegroundColor Green

# 2. src/main.js
(Get-Content "src/main.js" -Raw) -replace "const APP_VERSION = '.*?'", "const APP_VERSION = '$NewVersion'" | Set-Content "src/main.js" -NoNewline
Write-Host "  [OK] src/main.js" -ForegroundColor Green

# 3. public/sw.js
(Get-Content "public/sw.js" -Raw) -replace "const SW_VERSION = '.*?'", "const SW_VERSION = '$NewVersion'" | Set-Content "public/sw.js" -NoNewline
Write-Host "  [OK] public/sw.js" -ForegroundColor Green

Write-Host "`nVersion $NewVersion prete. Lance maintenant:" -ForegroundColor Yellow
Write-Host "  .\deploy-hedsvs.ps1" -ForegroundColor White
