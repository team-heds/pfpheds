$SSH_KEY = "C:\Users\antoine.quarroz\Desktop\LabDev\PrivateKey\HEdSLinux.txt"
$SSH_HOST = "ubuntu@83.228.204.5"

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "   REDEMARRAGE SUPABASE DISTANT" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

Write-Host "`nVerification des conteneurs Docker..." -ForegroundColor Yellow
ssh -i $SSH_KEY $SSH_HOST "docker ps -a --filter name=supabase --format 'table {{.Names}}\t{{.Status}}'"

Write-Host "`nRedemarrage des conteneurs Supabase..." -ForegroundColor Yellow
ssh -i $SSH_KEY $SSH_HOST "docker restart `$(docker ps -aq --filter name=supabase)"

if ($LASTEXITCODE -eq 0) {
    Write-Host "Conteneurs Supabase redemarres avec succes!" -ForegroundColor Green
    
    Write-Host "`nAttente du demarrage complet (10 secondes)..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    
    Write-Host "`nEtat des conteneurs apres redemarrage:" -ForegroundColor Cyan
    ssh -i $SSH_KEY $SSH_HOST "docker ps --filter name=supabase --format 'table {{.Names}}\t{{.Status}}'"
    
    Write-Host "`nRedemarrage termine!" -ForegroundColor Green
    Write-Host "Vous pouvez maintenant tester l'inscription" -ForegroundColor Yellow
} else {
    Write-Host "Erreur lors du redemarrage" -ForegroundColor Red
    Write-Host "Verifiez que Docker est lance sur le serveur" -ForegroundColor Yellow
}
