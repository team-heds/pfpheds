# Nettoyage des fichiers temporaires PFPHEDS
# Date: 28/11/2025

Write-Host "NETTOYAGE DES FICHIERS TEMPORAIRES..." -ForegroundColor Cyan

# Scripts SQL temporaires
$sqlFiles = @(
    "fix_rpcs.sql",
    "fix_rpcs_v2.sql",
    "fix_last_2_rpcs.sql",
    "fix_permissions.sql"
)

# Scripts JS de diagnostic
$jsFiles = @(
    "get_schema_complete.js",
    "get_full_schema.js",
    "list_real_tables.js",
    "list_tables.js",
    "list_tables_relations.js",
    "test_rls_bypass.js",
    "save_api_spec.js",
    "extract_tables.js",
    "extract_tables_from_paths.js",
    "list_rpcs.js",
    "list_rpcs_readable.js"
)

# Guides temporaires
$mdFiles = @(
    "GUIDE_EXECUTION_SQL.md",
    "GUIDE_FIX_PERMISSIONS.md",
    "SCHEMA_SUPABASE_COMPLET.md"
)

# Supprimer SQL
Write-Host "Suppression scripts SQL..." -ForegroundColor Yellow
foreach ($file in $sqlFiles) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "  OK: $file" -ForegroundColor Green
    }
}

# Supprimer JS
Write-Host "Suppression scripts JS..." -ForegroundColor Yellow
foreach ($file in $jsFiles) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "  OK: $file" -ForegroundColor Green
    }
}

# Supprimer MD
Write-Host "Suppression guides..." -ForegroundColor Yellow
foreach ($file in $mdFiles) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "  OK: $file" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "NETTOYAGE TERMINE !" -ForegroundColor Green
Write-Host ""
Write-Host "FICHIERS CONSERVES:" -ForegroundColor Cyan
Write-Host "  export_complete_data.js"
Write-Host "  test_all_rpcs.js"
Write-Host "  SCHEMA_COMPLET_ANALYSE.md"
Write-Host "  SUPABASE_PRODUCTION_READY.md"
Write-Host "  schema_analysis.json"
Write-Host "  rpc_test_results.json"
Write-Host "  export_*.json"
Write-Host ""
