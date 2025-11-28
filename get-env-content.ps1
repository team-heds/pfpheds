# Script pour lire le contenu du fichier .env Supabase

$remoteUser = "ubuntu"
$remoteHost = "83.228.204.5"
$localKeyPath = "C:\Users\antoine.quarroz\Desktop\LabDev\PrivateKey\HEdSLinux.txt"

Write-Host "=== LECTURE DU FICHIER .ENV SUPABASE ===" -ForegroundColor Yellow

$command = "sudo cat /opt/supabase/.env | grep -E '(ANON_KEY|SERVICE_ROLE_KEY|JWT_SECRET|POSTGRES_PASSWORD)'"

Write-Host "[INFO] Lecture de /opt/supabase/.env..." -ForegroundColor Cyan

try {
    $result = ssh -i $localKeyPath -o StrictHostKeyChecking=no "$remoteUser@$remoteHost" $command
    
    Write-Host "`n=== CLÉS TROUVÉES ===" -ForegroundColor Green
    Write-Output $result
    
    Write-Host "`n=== PROCHAINE ÉTAPE ===" -ForegroundColor Yellow
    Write-Host "Copie les valeurs ci-dessus et donne-les moi pour configurer MCP."
    
} catch {
    Write-Host "`n[ERROR] Erreur: $_" -ForegroundColor Red
    Write-Host "[INFO] Tu peux aussi te connecter manuellement avec:" -ForegroundColor Cyan
    Write-Host "ssh -i $localKeyPath $remoteUser@$remoteHost" -ForegroundColor White
    Write-Host "Puis exécuter: sudo cat /opt/supabase/.env | grep -E '(ANON_KEY|SERVICE_ROLE_KEY)'" -ForegroundColor White
}
