$SSH_KEY = "C:\Users\antoine.quarroz\Desktop\LabDev\PrivateKey\HEdSLinux.txt"
$SSH_HOST = "ubuntu@83.228.204.5"

Write-Host "`nVerification des colonnes PFP2..." -ForegroundColor Cyan

# Creer le script SQL
$sqlScript = @"
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'StudentsPhysio' 
AND column_name IN ('pfp2_place_id', 'pfp2_data')
ORDER BY column_name;
"@

# Sauvegarder temporairement
$sqlScript | Out-File -FilePath ".\temp_check.sql" -Encoding UTF8

# Copier sur le serveur
scp -i $SSH_KEY ".\temp_check.sql" "${SSH_HOST}:/tmp/check_pfp2.sql"

# Executer
$result = ssh -i $SSH_KEY $SSH_HOST "cat /tmp/check_pfp2.sql | docker exec -i supabase-db-1 psql -U postgres -d postgres"

Write-Host $result

# Nettoyer
Remove-Item ".\temp_check.sql" -ErrorAction SilentlyContinue
ssh -i $SSH_KEY $SSH_HOST "rm -f /tmp/check_pfp2.sql"

Write-Host "`nVerification terminee!" -ForegroundColor Green
