# Script pour récupérer les clés Supabase depuis le VPS

$remoteUser = "ubuntu"
$remoteHost = "83.228.204.5"
$localKeyPath = "C:\Users\antoine.quarroz\Desktop\LabDev\PrivateKey\HEdSLinux.txt"

Write-Host "=== RÉCUPÉRATION DES CLÉS SUPABASE ===" -ForegroundColor Yellow
Write-Host "[INFO] Connexion au VPS $remoteHost..." -ForegroundColor Cyan

# Commande bash simple à exécuter sur le VPS
$bashScript = @'
#!/bin/bash
echo "=== RECHERCHE DES CLÉS SUPABASE ==="
echo ""
echo "--- Conteneurs Docker ---"
docker ps --format "{{.Names}}" | grep supabase
echo ""
echo "--- Recherche fichiers docker-compose.yml ---"
find /home /opt /var /root -name "docker-compose.yml" -type f 2>/dev/null | xargs grep -l "supabase\|SUPABASE" 2>/dev/null | head -5
echo ""
echo "--- Recherche fichiers .env ---"
find /home /opt /var /root -name ".env" -type f 2>/dev/null | xargs grep -l "SUPABASE\|ANON_KEY\|SERVICE_ROLE" 2>/dev/null | head -5
echo ""
echo "--- Contenu des fichiers trouvés ---"
for file in $(find /home /opt /var /root -name ".env" -type f 2>/dev/null | xargs grep -l "SUPABASE" 2>/dev/null | head -3); do
    echo "Fichier: $file"
    grep -E "(ANON_KEY|SERVICE_ROLE_KEY|SUPABASE_URL|JWT_SECRET)" "$file" 2>/dev/null
    echo ""
done
'@

# Exécution via SSH
try {
    Write-Host "[INFO] Exécution de la recherche..." -ForegroundColor Cyan
    $result = $bashScript | ssh -i $localKeyPath -o StrictHostKeyChecking=no "$remoteUser@$remoteHost" "bash -s"
    
    Write-Host "`n=== RÉSULTATS ===" -ForegroundColor Green
    Write-Output $result
    
} catch {
    Write-Host "`n[ERROR] Erreur: $_" -ForegroundColor Red
}
