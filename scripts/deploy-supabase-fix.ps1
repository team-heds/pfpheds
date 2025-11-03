# =====================================================
# Script de déploiement du fix Supabase sur le serveur
# =====================================================

$SSH_KEY = "C:\Users\antoine.quarroz\Desktop\LabDev\PrivateKey\HEdSLinux.txt"
$SSH_HOST = "ubuntu@83.228.204.5"

Write-Host "🔧 DÉPLOIEMENT DU FIX SUPABASE" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Fonction pour exécuter une commande SSH
function Invoke-SSHCommand {
    param(
        [string]$Command,
        [string]$Description
    )
    
    Write-Host "📍 $Description..." -ForegroundColor Yellow
    ssh -i $SSH_KEY $SSH_HOST $Command
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Succès`n" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Erreur (code: $LASTEXITCODE)`n" -ForegroundColor Red
    }
}

# =====================================================
# ÉTAPE 1: Diagnostic initial
# =====================================================
Write-Host "`n=== ÉTAPE 1: DIAGNOSTIC INITIAL ===" -ForegroundColor Cyan

Invoke-SSHCommand "docker ps | grep supabase" "Vérifier les conteneurs Supabase"
Invoke-SSHCommand "docker ps -a | grep supabase | wc -l" "Compter les conteneurs Supabase"

# =====================================================
# ÉTAPE 2: Vérifier si Supabase CLI est installé
# =====================================================
Write-Host "`n=== ÉTAPE 2: VÉRIFICATION SUPABASE CLI ===" -ForegroundColor Cyan

Invoke-SSHCommand "which supabase" "Vérifier installation Supabase CLI"

# =====================================================
# ÉTAPE 3: Copier la migration SQL
# =====================================================
Write-Host "`n=== ÉTAPE 3: COPIE DE LA MIGRATION SQL ===" -ForegroundColor Cyan

$migrationFile = ".\supabase\migrations\FIX_auth_signup.sql"

if (Test-Path $migrationFile) {
    Write-Host "📤 Copie de la migration SQL vers le serveur..." -ForegroundColor Yellow
    scp -i $SSH_KEY $migrationFile "${SSH_HOST}:/tmp/FIX_auth_signup.sql"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Migration copiée`n" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Erreur de copie`n" -ForegroundColor Red
    }
} else {
    Write-Host "   ⚠️  Fichier de migration non trouvé: $migrationFile`n" -ForegroundColor Red
}

# =====================================================
# ÉTAPE 4: Afficher les commandes à exécuter
# =====================================================
Write-Host "`n=== COMMANDES À EXÉCUTER SUR LE SERVEUR ===" -ForegroundColor Cyan
Write-Host @"

Pour vous connecter au serveur:
-------------------------------
ssh -i "$SSH_KEY" $SSH_HOST

Commandes à exécuter une fois connecté:
---------------------------------------

1️⃣  VÉRIFIER DOCKER SUPABASE:
   docker ps | grep supabase

2️⃣  SI SUPABASE N'EST PAS LANCÉ:
   # Option A: Avec Supabase CLI
   cd /path/to/your/project
   npx supabase start

   # Option B: Avec docker-compose
   cd /path/to/backend
   docker-compose up -d

3️⃣  APPLIQUER LA MIGRATION SQL:
   # Option A: Via Supabase CLI
   npx supabase db push

   # Option B: Via psql directement
   docker exec -i supabase-db psql -U postgres -d postgres < /tmp/FIX_auth_signup.sql

   # Option C: Manuellement via l'interface Supabase
   # - Allez sur http://83.228.204.5:54323 (Studio Supabase)
   # - SQL Editor → Collez le contenu de FIX_auth_signup.sql → Run

4️⃣  VÉRIFIER LES LOGS:
   docker logs supabase-auth
   docker logs supabase-db

5️⃣  TESTER LA CONNEXION:
   # Vérifier que Supabase répond
   curl http://localhost:54321/rest/v1/

6️⃣  VARIABLES D'ENVIRONNEMENT:
   # Vérifier le fichier .env du projet
   cat /path/to/project/.env | grep SUPABASE

"@ -ForegroundColor White

# =====================================================
# MENU INTERACTIF
# =====================================================
Write-Host "`n=== ACTIONS DISPONIBLES ===" -ForegroundColor Cyan
Write-Host "1. Se connecter au serveur (SSH)" -ForegroundColor White
Write-Host "2. Voir les conteneurs Docker Supabase" -ForegroundColor White
Write-Host "3. Voir les logs Supabase Auth" -ForegroundColor White
Write-Host "4. Voir les logs Supabase DB" -ForegroundColor White
Write-Host "5. Redémarrer Supabase" -ForegroundColor White
Write-Host "6. Appliquer la migration SQL" -ForegroundColor White
Write-Host "7. Quitter" -ForegroundColor White

$choice = Read-Host "`nChoisissez une action (1-7)"

switch ($choice) {
    "1" {
        Write-Host "`n🔐 Connexion au serveur..." -ForegroundColor Cyan
        ssh -i $SSH_KEY $SSH_HOST
    }
    "2" {
        Invoke-SSHCommand "docker ps -a | grep supabase" "Liste des conteneurs Supabase"
    }
    "3" {
        Invoke-SSHCommand "docker logs --tail 50 supabase-auth" "Logs Supabase Auth (50 dernières lignes)"
    }
    "4" {
        Invoke-SSHCommand "docker logs --tail 50 supabase-db" "Logs Supabase DB (50 dernières lignes)"
    }
    "5" {
        Write-Host "`n⚠️  ATTENTION: Ceci va redémarrer Supabase!" -ForegroundColor Yellow
        $confirm = Read-Host "Êtes-vous sûr? (oui/non)"
        if ($confirm -eq "oui") {
            Invoke-SSHCommand "docker restart \$(docker ps -q --filter name=supabase)" "Redémarrage des conteneurs Supabase"
        }
    }
    "6" {
        Write-Host "`n📊 Application de la migration SQL..." -ForegroundColor Cyan
        Invoke-SSHCommand "docker exec -i supabase-db psql -U postgres -d postgres < /tmp/FIX_auth_signup.sql" "Exécution de la migration"
    }
    "7" {
        Write-Host "`n👋 Au revoir!" -ForegroundColor Cyan
        exit
    }
    default {
        Write-Host "`n❌ Choix invalide" -ForegroundColor Red
    }
}

Write-Host "`n✅ Script terminé" -ForegroundColor Green
