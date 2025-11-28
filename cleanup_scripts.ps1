# ============================================================================
# NETTOYAGE DES SCRIPTS TEMPORAIRES - PFPHEDS
# Date: 28/11/2025
# ============================================================================

Write-Host "🧹 NETTOYAGE DES FICHIERS TEMPORAIRES..." -ForegroundColor Cyan
Write-Host ""

# Scripts SQL temporaires (deja appliques)
$sqlFiles = @(
    "fix_rpcs.sql",
    "fix_rpcs_v2.sql",
    "fix_last_2_rpcs.sql",
    "fix_permissions.sql"
)

# Scripts JS de diagnostic (ne servent plus)
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

# Supprimer les fichiers SQL
Write-Host "📄 Suppression des scripts SQL temporaires..." -ForegroundColor Yellow
foreach ($file in $sqlFiles) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "  ✅ $file supprime" -ForegroundColor Green
    }
}

# Supprimer les fichiers JS
Write-Host ""
Write-Host "📄 Suppression des scripts JS de diagnostic..." -ForegroundColor Yellow
foreach ($file in $jsFiles) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "  ✅ $file supprime" -ForegroundColor Green
    }
}

# Supprimer les guides temporaires
Write-Host ""
Write-Host "📄 Suppression des guides temporaires..." -ForegroundColor Yellow
foreach ($file in $mdFiles) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "  ✅ $file supprime" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "✅ NETTOYAGE TERMINE !" -ForegroundColor Green
Write-Host ""
Write-Host "FICHIERS CONSERVES:" -ForegroundColor Cyan
Write-Host "  export_complete_data.js (backup automatique)"
Write-Host "  test_all_rpcs.js (tests RPCs)"
Write-Host "  SCHEMA_COMPLET_ANALYSE.md (documentation technique)"
Write-Host "  SUPABASE_PRODUCTION_READY.md (documentation finale)"
Write-Host "  schema_analysis.json (donnees analyse)"
Write-Host "  rpc_test_results.json (resultats tests)"
Write-Host "  export_*.json (backups donnees)"
Write-Host ""
