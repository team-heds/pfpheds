$SSH_KEY = "C:\Users\antoine.quarroz\Desktop\LabDev\PrivateKey\HEdSLinux.txt"
$SSH_HOST = "ubuntu@83.228.204.5"

Write-Host "`n=== STRUCTURE DE LA TABLE StudentsPhysio ===" -ForegroundColor Cyan

# Creer le script SQL
$sqlScript = @"
-- Colonnes de la table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'StudentsPhysio'
ORDER BY ordinal_position;
"@

# Sauvegarder temporairement
$sqlScript | Out-File -FilePath ".\temp_structure.sql" -Encoding UTF8

# Copier sur le serveur
scp -i $SSH_KEY ".\temp_structure.sql" "${SSH_HOST}:/tmp/check_structure.sql"

# Executer
Write-Host "`nColonnes de la table StudentsPhysio:" -ForegroundColor Yellow
$result = ssh -i $SSH_KEY $SSH_HOST "cat /tmp/check_structure.sql | docker exec -i supabase-db-1 psql -U postgres -d postgres"
Write-Host $result

# Nettoyer
Remove-Item ".\temp_structure.sql" -ErrorAction SilentlyContinue
ssh -i $SSH_KEY $SSH_HOST "rm -f /tmp/check_structure.sql"

Write-Host "`nTermine!" -ForegroundColor Green
